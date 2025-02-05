const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const tripRoutes = require("./routes/tripRoutes")

require("dotenv").config();

const app = express();

// ✅ Enable CORS for frontend at http://localhost:3000
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// Middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use("/api", authRoutes, tripRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
