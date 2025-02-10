const mongoose = require("mongoose");

const groupChatSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Group chat name (e.g., "Hiking Trip Chat")
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users in the chat
  experience: { type: mongoose.Schema.Types.ObjectId, ref: "Experience" }, // Optional: Linked Experience
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }], // Messages in the chat
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "GroupChat", required: true }, // Chat reference
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Message sender
  content: { type: String, required: true }, // Message text
  attachments: [{ type: String }], // Optional: File URLs for attachments
  createdAt: { type: Date, default: Date.now },
});

const GroupChat = mongoose.model("GroupChat", groupChatSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = { GroupChat, Message };
