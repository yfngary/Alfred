const express = require("express");
const Trip = require("../models/Trip");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

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

module.exports = router;
