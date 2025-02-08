const express = require("express");
const Trip = require("../models/Trip");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// POST: Create a new trip
router.post("/trips", authMiddleware, async (req, res) => {
  try {
    const { tripName, destination, startDate, endDate, lodgings, guests } =
      req.body;
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
    res
      .status(201)
      .json({ message: "Trip created successfully", trip: newTrip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/userTrips", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id; // Use authenticated user's ID

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const trips = await Trip.find({ userId });
    res.json({ trips });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/trips/:tripId", authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const updatedTrip = await Trip.findByIdAndUpdate(tripId, req.body, {
      new: true, // Return updated document
      runValidators: true, // Ensure validation runs on update
    });

    if (!updatedTrip) {
      return res.status(404).json({ error: "Trip not found." });
    }

    res.status(200).json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ error: "Failed to update trip." });
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
      return res
        .status(403)
        .json({ error: "Unauthorized to modify this trip" });
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

    trip.guests = trip.guests.filter(
      (guest) => guest._id.toString() !== req.params.guestId
    );
    await trip.save();

    res.json({ message: "Guest removed successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/trips/:tripId/lodging/:lodgingId",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("🛠 Received update request:", req.params, req.body); // Debugging

      const { address, checkIn, checkOut } = req.body;
      const trip = await Trip.findById(req.params.tripId);

      if (!trip || trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const lodging = trip.lodgings.id(req.params.lodgingId);
      if (!lodging) {
        return res.status(404).json({ error: "Lodging not found" });
      }

      lodging.address = address || lodging.address;
      lodging.checkIn = checkIn || lodging.checkIn;
      lodging.checkOut = checkOut || lodging.checkOut;

      await trip.save();
      res
        .status(200)
        .json({ message: "✅ Lodging updated successfully", trip });
    } catch (error) {
      console.error("❌ Error updating lodging:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post("/:tripId/experiences", authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { title, date, startTime, endTime, isMultiDay, type, guests } =
      req.body;

    const trip = await Trip.findById(tripId);
    if (!trip || trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const newExperience = {
      title,
      date,
      startTime,
      endTime,
      type,
      isMultiDay,
      guests,
    };

    console.log(trip)

    trip.experiences.push(newExperience);
    await trip.save();

    res.status(201).json({ message: "Experience added successfully", trip });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error)
  }
});

router.get("/:tripId", authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update an experience
router.put(
  "/:tripId/experiences/:experienceId",
  authMiddleware,
  async (req, res) => {
    try {
      const { tripId, experienceId } = req.params;
      const updatedExperience = req.body;

      const trip = await Trip.findById(tripId);
      if (!trip || trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const experience = trip.experiences.id(experienceId);
      if (!experience) {
        return res.status(404).json({ error: "Experience not found" });
      }

      Object.assign(experience, updatedExperience);
      await trip.save();

      res
        .status(200)
        .json({ message: "Experience updated successfully", trip });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete an experience
router.delete(
  "/:tripId/experiences/:experienceId",
  authMiddleware,
  async (req, res) => {
    try {
      const { tripId, experienceId } = req.params;

      const trip = await Trip.findById(tripId);
      if (!trip || trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      trip.experiences = trip.experiences.filter(
        (exp) => exp._id.toString() !== experienceId
      );

      await trip.save();
      res
        .status(200)
        .json({ message: "Experience deleted successfully", trip });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
