const mongoose = require("mongoose");
const Chat = require("./Chat"); // ✅ Import Chat Model

const experienceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String },
  isMultiDay: { type: Boolean, default: false },
  endDate: { type: Date },
  type: { 
    type: String, 
    enum: ["activity", "meal", "other"], 
    required: true 
  },
  mealType: { 
    type: String, 
    enum: ["restaurant", "home", "picnic", "delivery"],
    required: function() { return this.type === 'meal'; }
  },
  location: { type: String },
  details: { type: String },
  guests: [{ type: String }], // Store guest names as strings
  attachments: [{ 
    filename: String,
    path: String,
    mimetype: String,
    size: Number
  }],
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" } // Add chat reference
}, { timestamps: true });

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
  guests: [GuestSchema],
  experiences: [experienceSchema],
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
});

module.exports = mongoose.model("Trip", TripSchema);
