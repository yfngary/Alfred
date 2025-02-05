const express = require("express");
const Trip = require("../models/Trip");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// POST: Create a new trip
router.post("/trips", authMiddleware, async (req, res) => {
  try {
    const { tripName, destination, startDate, endDate, lodgings } = req.body;
    const newTrip = new Trip({
      userId: req.user.id,
      tripName,
      destination,
      startDate,
      endDate,
      lodgings,
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

// PUT: Update trip dates (startDate, endDate)
router.put("/trips/:id", authMiddleware, async (req, res) => {
  const { startDate, endDate } = req.body;

  try {
    // Find the trip by ID and ensure the user owns the trip
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });

    if (!trip) {
      return res.status(404).json({ error: "Trip not found or you don't have permission to update it." });
    }

    // Validate dates
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: "End date cannot be before the start date." });
    }

    // Update the trip with the new dates
    trip.startDate = new Date(startDate);
    trip.endDate = new Date(endDate);

    // Save the updated trip
    await trip.save();
    res.status(200).json({ message: "Trip updated successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
