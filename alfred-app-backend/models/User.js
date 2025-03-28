const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    match: [/^\S*$/, "Username cannot contain spaces"], // No spaces allowed
  },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  profilePicture: { type: String }, // Store image URL
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  groupChats: [{ type: mongoose.Schema.Types.ObjectId, ref: "GroupChat" }], // Reference to group chats
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  emailVerificationExpires: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

module.exports = mongoose.model("User", UserSchema);
