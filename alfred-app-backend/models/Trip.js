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
  type: { type: String, enum: ['adult', 'child'], default: 'adult' },
  relationship: { type: String },
});

const GuestRelationshipSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level1: [{
    id: { type: String },
    _id: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    type: { type: String, enum: ['adult', 'child'], default: 'adult' }
  }],
  level2: [{
    id: { type: String },
    _id: { type: String },
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    type: { type: String, enum: ['adult', 'child'], default: 'adult' }
  }]
});

const LodgingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: String,
  checkIn: Date,
  checkOut: Date,
  details: { type: String },
  lodgingType: { 
    type: String, 
    enum: ["hotel", "airbnb", "resort", "other"],
    default: "other"
  },
  assignedGuests: [{ type: String }] // Store guest names as strings (consistent with experiences)
});

const TripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Trip owner
  tripName: String,
  destination: String,
  startDate: Date,
  endDate: Date,
  lodgings: [LodgingSchema],
  guests: [GuestSchema],
  guestRelationships: [GuestRelationshipSchema], // Add guest relationships
  experiences: [experienceSchema],
  chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  // Add access control fields
  collaborators: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { 
      type: String, 
      enum: ["admin", "editor", "viewer"],
      default: "viewer"
    },
    addedAt: { type: Date, default: Date.now }
  }],
  isPublic: { type: Boolean, default: false },
  inviteCode: { type: String, unique: true, sparse: true }
});

module.exports = mongoose.model("Trip", TripSchema);
