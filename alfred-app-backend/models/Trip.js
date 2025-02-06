const mongoose = require("mongoose");

const GuestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  relationship: { type: String },
});

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
  guests: [GuestSchema], // Guests added to the trip
});

module.exports = mongoose.model("Trip", TripSchema);
