const mongoose = require("mongoose");

const LodgingSchema = new mongoose.Schema({
  address: String,
  checkIn: Date,
  checkOut: Date,
});

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tripName: String,
  destination: String,
  startDate: Date,
  endDate: Date,
  lodgings: [LodgingSchema],
});

module.exports = mongoose.model("Trip", TripSchema);
