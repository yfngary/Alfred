const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");
const chatRoutes = require("./routes/chatRoutes");
const userRoutes = require("./routes/userRoutes");
const requestRoutes = require("./routes/requestRoutes");
const Message = require("./models/Message"); // ✅ Import Message model
const Chat = require("./models/Chat"); // ✅ Import Chat model
const path = require("path");
const http = require("http");
const { profile } = require("console");

require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Frontend URL
    methods: ["GET", "POST"],
  },
});

// ✅ Enable CORS for frontend at http://localhost:3000
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Routes
app.use("/api", authRoutes, tripRoutes, chatRoutes);
app.use("/userApi", userRoutes);
app.use("/requestsApi", requestRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

io.on("connection", (socket) => {
  console.log("🔵 New WebSocket Connection:", socket.id);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`✅ User joined chat: ${chatId}`);
  });

  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
    console.log(`🚪 User left chat: ${chatId}`);
  });

  socket.on("sendMessage", async (messageData) => {
    try {
      const { chatId, sender, content } = messageData;

      // Create and save the new message
      const newMessage = new Message({ chatId, sender, content });
      await newMessage.save();

      // Add message reference to chat
      await Chat.findByIdAndUpdate(chatId, { $push: { messages: newMessage._id } });

      // Populate sender information before broadcasting
      const populatedMessage = await Message.findById(newMessage._id)
        .populate('sender', 'name email');

      // Broadcast to everyone in the chat room (including sender)
      io.to(chatId).emit("newMessage", populatedMessage);
    } catch (error) {
      console.error("Error handling message:", error);
      // Emit error back to sender only
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 User Disconnected:", socket.id);
  });
});
