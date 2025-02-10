const express = require("express");
const router = express.Router();
const { GroupChat, Message } = require("../models/chatModels");
const authMiddleware = require("../middleware/authMiddleware");

module.exports = (io) => {
  
  // Send a message and notify all chat members in real-time
  router.post("/:chatId/messages", authMiddleware, async (req, res) => {
    try {
      const { content, attachments } = req.body;
      const { chatId } = req.params;

      if (!content) {
        return res.status(400).json({ error: "Message content is required." });
      }

      const newMessage = new Message({
        chatId,
        sender: req.user.id,
        content,
        attachments: attachments || [],
      });

      await newMessage.save();
      await GroupChat.findByIdAndUpdate(chatId, { $push: { messages: newMessage._id } });

      const populatedMessage = await newMessage.populate("sender", "name email");

      // Emit the message to all users in the chat room
      io.to(chatId).emit("newMessage", populatedMessage);

      res.status(201).json(populatedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};
