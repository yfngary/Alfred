const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const router = express.Router();
const mongoose = require("mongoose");

router.get("/profile", authMiddleware, async (req, res) => {
  try {
    console.log("Decoded User from Token:", req.user);

    // Attempt to fetch the user
    const user = await User.findById(req.user.id);
    console.log(user);
    if (!user) {
      console.log("User not found for ID:", req.user.id);
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
    });
  } catch (error) {
    res.status(500).json({ message: "Server grump" });
  }
});

router.get("/searchUsers", authMiddleware, async (req, res) => {
  const query = req.query.query;

  try {
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { name: { $regex: query, $options: "i" } },
      ],
    }).select("username name profilePicture");

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: "Error searching users" });
  }
});

// GET: Fetch user by ID
router.get("/:userId", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate the userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Fetch the user excluding sensitive fields like password
    const user = await User.findById(userId).select(
      "username name profilePicture email"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// GET: Fetch Friends List
router.get("/:userId/friends", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId as a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // Fetch the user and populate the friends list
    const user = await User.findById(userId).populate(
      "friends",
      "username name profilePicture"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({ friends: user.friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
