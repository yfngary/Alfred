const express = require("express");
const Trip = require("../models/Trip");
const Chat = require("../models/Chat"); // Adjust based on your file structure
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require("../models/User");

const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedFileTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Error: File type not supported!'));
    }
  }
});

// POST: Create a new trip
router.post("/trips", authMiddleware, async (req, res) => {
  try {
    const { tripName, destination, location, startDate, endDate, lodgings, guests } = req.body;

    // Create a chat for the trip with just the creator initially
    const newChat = new Chat({
      members: [req.user.id], // Start with just the trip creator
      messages: [], // Empty messages at creation
    });
    await newChat.save();

    // Create the trip with the chat reference
    const newTrip = new Trip({
      userId: req.user.id,
      tripName,
      destination: destination || location, // Use either destination or location field
      startDate,
      endDate,
      lodgings: lodgings || [],
      guests: guests || [],
      chat: newChat._id,
    });

    await newTrip.save();

    // Populate the chat in the response
    const populatedTrip = await Trip.findById(newTrip._id).populate('chat');

    res.status(201).json({
      message: "Trip created successfully",
      trip: populatedTrip
    });
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/userTrips", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const trips = await Trip.find({ userId })
      .populate('chat')
      .populate({
        path: 'experiences',
        populate: {
          path: 'chat',
          model: 'Chat'
        }
      });

    console.log("Populated trips:", JSON.stringify(trips, null, 2));
    res.json({ trips });
  } catch (error) {
    console.error("Error in userTrips:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/trips/:tripId", authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip || trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await Trip.findByIdAndDelete(tripId);
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});


router.put("/trips/:tripId", authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;
    const updatedTrip = await Trip.findByIdAndUpdate(tripId, req.body, {
      new: true, // Return updated document
      runValidators: true, // Ensure validation runs on update
    });

    if (!updatedTrip) {
      return res.status(404).json({ error: "Trip not found." });
    }

    res.status(200).json({ success: true, trip: updatedTrip });
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(500).json({ error: "Failed to update trip." });
  }
});

// Update guest details (relationship, name, email, phone)
router.put("/:tripId/guests/:guestId", authMiddleware, async (req, res) => {
  try {
    const { tripId, guestId } = req.params;
    const { name, email, phone, relationship } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Ensure the user is the owner of the trip
    if (trip.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: "Unauthorized to modify this trip" });
    }

    const guest = trip.guests.id(guestId);
    if (!guest) {
      return res.status(404).json({ error: "Guest not found" });
    }

    // Update guest details if provided
    if (name) guest.name = name;
    if (email) guest.email = email;
    if (phone) guest.phone = phone;
    if (relationship) guest.relationship = relationship;

    await trip.save();
    res.json({ message: "Guest updated successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Add a guest to a trip
router.post("/:tripId/guests", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const trip = await Trip.findById(req.params.tripId).populate('chat');

    if (!trip || trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Add the guest to the trip
    const newGuest = { name, email, phone };
    trip.guests.push(newGuest);

    // If the guest has a user account (email matches), add them to the chat
    if (email) {
      const guestUser = await User.findOne({ email });
      if (guestUser && trip.chat) {
        // Only add if not already a member
        if (!trip.chat.members.includes(guestUser._id)) {
          trip.chat.members.push(guestUser._id);
          await trip.chat.save();
        }
      }
    }

    await trip.save();
    
    // Re-fetch the trip with populated chat to return updated data
    const updatedTrip = await Trip.findById(trip._id).populate('chat');
    res.status(201).json({ message: "Guest added successfully", trip: updatedTrip });
  } catch (error) {
    console.error("Error adding guest:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Update a guest's details
router.put("/:tripId/guests/:guestId", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const trip = await Trip.findById(req.params.tripId);

    if (!trip || trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const guest = trip.guests.id(req.params.guestId);
    if (!guest) {
      return res.status(404).json({ error: "Guest not found" });
    }

    guest.name = name || guest.name;
    guest.email = email || guest.email;
    guest.phone = phone || guest.phone;

    await trip.save();
    res.json({ message: "Guest updated successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 📌 Remove a guest from a trip
router.delete("/:tripId/guests/:guestId", authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip || trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    trip.guests = trip.guests.filter(
      (guest) => guest._id.toString() !== req.params.guestId
    );
    await trip.save();

    res.json({ message: "Guest removed successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/trips/:tripId/lodging/:lodgingId",
  authMiddleware,
  async (req, res) => {
    try {
      console.log("🛠 Received update request:", req.params, req.body); // Debugging

      const { address, checkIn, checkOut } = req.body;
      const trip = await Trip.findById(req.params.tripId);

      if (!trip || trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const lodging = trip.lodgings.id(req.params.lodgingId);
      if (!lodging) {
        return res.status(404).json({ error: "Lodging not found" });
      }

      lodging.address = address || lodging.address;
      lodging.checkIn = checkIn || lodging.checkIn;
      lodging.checkOut = checkOut || lodging.checkOut;

      await trip.save();
      res
        .status(200)
        .json({ message: "✅ Lodging updated successfully", trip });
    } catch (error) {
      console.error("❌ Error updating lodging:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// POST route to create a new experience with file uploads
router.post("/:tripId/experiences", authMiddleware, upload.array('attachments', 10), async (req, res) => {
  try {
    const { tripId } = req.params;
    
    // Parse the experience data from the request
    let experienceData;
    try {
      experienceData = JSON.parse(req.body.experienceData);
    } catch (error) {
      return res.status(400).json({ error: "Invalid experience data format" });
    }
    
    // Find the trip
    const trip = await Trip.findById(tripId).populate('guests');
    if (!trip || trip.userId.toString() !== req.user.id) {
      // Clean up uploaded files if auth fails
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Create a chat for the experience
    const newChat = new Chat({
      members: [req.user.id], // Start with trip creator
      messages: [],
    });
    await newChat.save();
    
    // Process file uploads
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size
    })) : [];
    
    // Create new experience object with chat
    const newExperience = {
      title: experienceData.title,
      date: experienceData.date,
      startTime: experienceData.startTime,
      endTime: experienceData.endTime,
      isMultiDay: experienceData.isMultiDay || false,
      endDate: experienceData.endDate,
      type: experienceData.type,
      location: experienceData.location,
      details: experienceData.details,
      guests: experienceData.guests,
      attachments: attachments,
      chat: newChat._id // Add chat reference
    };
    
    // Add meal type if applicable
    if (experienceData.type === 'meal' && experienceData.mealType) {
      newExperience.mealType = experienceData.mealType;
    }

    // Add guests to the chat if they have user accounts
    if (experienceData.guests && experienceData.guests.length > 0) {
      // Find guest users by matching their names with trip guests
      const guestEmails = trip.guests
        .filter(guest => experienceData.guests.includes(guest.name))
        .map(guest => guest.email)
        .filter(Boolean); // Remove any undefined/null emails

      if (guestEmails.length > 0) {
        const guestUsers = await User.find({ email: { $in: guestEmails } });
        if (guestUsers.length > 0) {
          newChat.members.push(...guestUsers.map(user => user._id));
          await newChat.save();
        }
      }
    }
    
    // Add the experience to the trip
    trip.experiences.push(newExperience);
    await trip.save();
    
    // Get the ID of the newly added experience and populate its chat
    const addedExperience = trip.experiences[trip.experiences.length - 1];
    
    return res.status(201).json({
      message: "Experience added successfully",
      experienceId: addedExperience._id,
      chatId: newChat._id
    });
  } catch (error) {
    console.error("Server error creating experience:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/trips/:tripId", authMiddleware, async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId).populate('chat');
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update an experience
router.put(
  "/:tripId/experiences/:experienceId",
  authMiddleware,
  async (req, res) => {
    try {
      const { tripId, experienceId } = req.params;
      const updatedExperience = req.body;

      const trip = await Trip.findById(tripId);
      if (!trip || trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const experience = trip.experiences.id(experienceId);
      if (!experience) {
        return res.status(404).json({ error: "Experience not found" });
      }

      Object.assign(experience, updatedExperience);
      await trip.save();

      res
        .status(200)
        .json({ message: "Experience updated successfully", trip });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete an experience
router.delete(
  "/:tripId/experiences/:experienceId",
  authMiddleware,
  async (req, res) => {
    try {
      const { tripId, experienceId } = req.params;

      const trip = await Trip.findById(tripId);
      if (!trip || trip.userId.toString() !== req.user.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      trip.experiences = trip.experiences.filter(
        (exp) => exp._id.toString() !== experienceId
      );

      await trip.save();
      res
        .status(200)
        .json({ message: "Experience deleted successfully", trip });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get trip by chat ID
router.get("/trips/chat/:chatId", authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // First try to find a trip with this chat ID
    let trip = await Trip.findOne({ chat: chatId })
      .populate('chat')
      .populate({
        path: 'experiences',
        populate: {
          path: 'chat'
        }
      });
    
    // If no trip found, try to find a trip that has an experience with this chat ID
    if (!trip) {
      trip = await Trip.findOne({ 'experiences.chat': chatId })
        .populate('chat')
        .populate({
          path: 'experiences',
          populate: {
            path: 'chat'
          }
        });
      
      if (!trip) {
        return res.status(404).json({ error: "Trip not found" });
      }
    }

    // Log the trip data for debugging
    console.log("Found trip:", {
      id: trip._id,
      name: trip.tripName,
      chatId: trip.chat?._id,
      experiences: trip.experiences?.map(exp => ({
        title: exp.title,
        chatId: exp.chat?._id
      }))
    });

    res.json({ trip });
  } catch (error) {
    console.error("Error finding trip by chat ID:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
