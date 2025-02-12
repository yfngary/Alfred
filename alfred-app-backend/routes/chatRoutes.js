const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const authMiddleware = require("../middleware/authMiddleware");

// Send a new message
router.post("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    // Validate message content
    if (!content) return res.status(400).json({ error: "Message cannot be empty" });

    // Create new message
    const newMessage = new Message({
      chatId,
      sender: req.user.id, // Get sender from the authenticated user
      content,
    });

    // Save message to DB
    await newMessage.save();

    // Add message reference to the chat
    await Chat.findByIdAndUpdate(chatId, { $push: { messages: newMessage._id } });

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
    console.error(error);
  }
});

// 🟢 GET: Fetch messages for a chat
router.get("/:chatId/messages", authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;

    // ✅ Find the chat and populate messages
    const chat = await Chat.findById(chatId).populate({
      path: "messages",
      populate: { path: "sender", select: "name email" }, // Include sender details
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    res.json({ messages: chat.messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
