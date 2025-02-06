const express = require("express");
const Trip = require("../models/Trip");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// POST: Create a new trip
router.post("/trips", authMiddleware, async (req, res) => {
  try {
    const { tripName, destination, startDate, endDate, lodgings, guests } = req.body;
    const newTrip = new Trip({
      userId: req.user.id,
      tripName,
      destination,
      startDate,
      endDate,
      lodgings,
      guests,
    });

    await newTrip.save();
    res.status(201).json({ message: "Trip created successfully", trip: newTrip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET: Fetch trips for the authenticated user
router.get("/userTrips", authMiddleware, async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id });
    res.json({ trips });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// PUT: Update trip dates and lodging details
router.put("/trips/:id", authMiddleware, async (req, res) => {
  const { startDate, endDate, lodgings } = req.body;

  try {
    // Find the trip by ID and ensure the user owns the trip
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found or you don't have permission to update it." });
    }

    // Validate the dates
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: "End date cannot be before the start date." });
    }

    // Update the trip dates
    trip.startDate = new Date(startDate);
    trip.endDate = new Date(endDate);

    // If lodging details are included, update them as well
    if (lodgings && Array.isArray(lodgings)) {
      trip.lodgings = lodgings.map((lodging) => ({
        ...lodging,
        // Optionally: Adjust lodging check-in and check-out dates based on the trip's new dates
        checkIn: lodging.checkIn >= new Date(startDate) ? lodging.checkIn : new Date(startDate),
        checkOut: lodging.checkOut <= new Date(endDate) ? lodging.checkOut : new Date(endDate),
      }));
    }

    // Save the updated trip
    await trip.save();
    res.status(200).json({ message: "Trip and lodging details updated successfully", trip });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update guest details (relationship, name, email, phone)
router.put("/:tripId/guests/:guestId", authMiddleware, async (req, res) => {
  try {
    const { tripId, guestId } = req.params;
    const { name, email, phone, relationship } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Ensure the user is the owner of the trip
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to modify this trip" });
    }

    const guest = trip.guests.id(guestId);
    if (!guest) {
      return res.status(404).json({ error: "Guest not found" });
    }

    // Update guest details if provided
    if (name) guest.name = name;
    if (email) guest.email = email;
    if (phone) guest.phone = phone;
    if (relationship) guest.relationship = relationship;

    await trip.save();
    res.json({ message: "Guest updated successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Add a guest to a trip
router.post("/:tripId/guests", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const trip = await Trip.findById(req.params.tripId);

    if (!trip || trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const newGuest = { name, email, phone };
    trip.guests.push(newGuest);
    await trip.save();

    res.status(201).json({ message: "Guest added successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Update a guest's details
router.put("/:tripId/guests/:guestId", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const trip = await Trip.findById(req.params.tripId);

    if (!trip || trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const guest = trip.guests.id(req.params.guestId);
    if (!guest) {
      return res.status(404).json({ error: "Guest not found" });
    }

    guest.name = name || guest.name;
    guest.email = email || guest.email;
    guest.phone = phone || guest.phone;

    await trip.save();
    res.json({ message: "Guest updated successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Remove a guest from a trip
router.delete("/:tripId/guests/:guestId", authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip || trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    trip.guests = trip.guests.filter((guest) => guest._id.toString() !== req.params.guestId);
    await trip.save();

    res.json({ message: "Guest removed successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;