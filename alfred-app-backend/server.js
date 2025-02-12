const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes");
const chatRoutes = require("./routes/chatRoutes");
const Message = require("./models/Message"); // ✅ Import Message model
const Chat = require("./models/Chat"); // ✅ Import Chat model
const http = require("http");

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

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 🔵 WebSocket Connection
io.on("connection", (socket) => {
  console.log("New WebSocket Connection:", socket.id);

  // ✅ Join a specific chat room
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  // ✅ Listen for new messages
  socket.on("sendMessage", async (messageData) => {
    try {
      const { chatId, sender, content } = messageData;

      // ✅ Save the message to MongoDB
      const newMessage = new Message({
        chatId,
        sender,
        content,
      });

      await newMessage.save();

      // ✅ Add message reference to chat
      await Chat.findByIdAndUpdate(chatId, { $push: { messages: newMessage._id } });

      // ✅ Broadcast message to chat members
      io.to(chatId).emit("newMessage", newMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  // ✅ Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);
  });
});
