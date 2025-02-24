const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const FriendRequest = require("../models/FriendRequest");
const User = require("../models/User");
const router = express.Router();

router.get("/friendRequests", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const friendRequests = await FriendRequest.find({ to: userId, status: "pending" })
      .populate("from", "username profilePicture")
      .exec();

    res.status(200).json({ friendRequests });
  } catch (error) {
    console.error("Error fetching friend requests:", error);
    res.status(500).json({ error: "Server error while fetching friend requests." });
  }
});

// ✅ Send Friend Request
router.post("/sendFriendRequest/:toUserId", authMiddleware, async (req, res) => {
  try {
    const fromUserId = req.user.id; // Authenticated user
    const toUserId = req.params.toUserId; // Target user

    // 🚫 Prevent sending friend request to self
    if (fromUserId === toUserId) {
      return res.status(400).json({ error: "You cannot send a friend request to yourself." });
    }

    // ✅ Check if the recipient exists
    const recipient = await User.findById(toUserId);
    if (!recipient) {
      return res.status(404).json({ error: "User not found." });
    }

    // ✅ Check if a friend request already exists
    const existingRequest = await FriendRequest.findOne({
      from: fromUserId,
      to: toUserId,
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ error: "Friend request already sent." });
    }

    // ✅ Create a new friend request
    const newFriendRequest = new FriendRequest({
      from: fromUserId,
      to: toUserId,
    });

    await newFriendRequest.save();

    res.status(201).json({ message: "Friend request sent successfully." });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: "Server error while sending friend request." });
  }
});

router.post("/friendRequests/:id/accept", authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found." });
    }

    if (friendRequest.to.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized action." });
    }

    // Update friend request status
    friendRequest.status = "accepted";
    await friendRequest.save();

    // Add each other as friends
    await User.findByIdAndUpdate(friendRequest.from, { $push: { friends: friendRequest.to } });
    await User.findByIdAndUpdate(friendRequest.to, { $push: { friends: friendRequest.from } });

    res.status(200).json({ message: "Friend request accepted." });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ error: "Server error while accepting friend request." });
  }
});

// ✅ Reject Friend Request
router.post("/friendRequests/:id/reject", authMiddleware, async (req, res) => {
  try {
    const requestId = req.params.id;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ error: "Friend request not found." });
    }

    if (friendRequest.to.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized action." });
    }

    friendRequest.status = "rejected";
    await friendRequest.save();

    res.status(200).json({ message: "Friend request rejected." });
  } catch (error) {
    console.error("Error rejecting friend request:", error);
    res.status(500).json({ error: "Server error while rejecting friend request." });
  }
});

module.exports = router;
