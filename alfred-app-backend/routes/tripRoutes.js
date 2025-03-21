const express = require("express");
const Trip = require("../models/Trip");
const Chat = require("../models/Chat"); // Adjust based on your file structure
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require("../models/User");
const { sendTripInvitationEmail } = require('../utils/emailService');
const { sendTripInvitationSMS } = require('../utils/smsService');

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
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { 
      tripName, 
      destination, 
      location, 
      startDate, 
      endDate, 
      lodgings, 
      guests,
      guestRelationships 
    } = req.body;

    // Log the incoming data for debugging
    console.log("Creating new trip with data:", {
      tripName,
      destination, 
      location,
      guestsCount: guests?.length,
      relationshipsCount: guestRelationships?.length
    });

    // Create a chat for the trip with just the creator initially
    const newChat = new Chat({
      members: [req.user.id],
      messages: [],
    });
    await newChat.save();

    // Process guests to ensure they have proper structure
    const processedGuests = guests.map(guest => ({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      type: guest.type || 'adult'
    }));

    // Process guest relationships to ensure proper structure with additional error handling
    let processedRelationships = [];
    try {
      processedRelationships = guestRelationships?.map(group => {
        if (!group) {
          console.warn("Received null or undefined group in guestRelationships");
          return null;
        }
        
        return {
          name: group.name || "Unnamed Group",
          level1: (group.level1 || []).map(guest => {
            // Handle both string IDs and full guest objects
            if (typeof guest === 'string') {
              return guest;
            }
            // For full objects, ensure they have all required fields
            return {
              id: guest.id || guest._id || "",
              _id: guest._id || guest.id || "",
              name: guest.name || "Unnamed Guest",
              email: guest.email || '',
              phone: guest.phone || '',
              type: guest.type || 'adult'
            };
          }),
          level2: (group.level2 || []).map(guest => {
            // Handle both string IDs and full guest objects
            if (typeof guest === 'string') {
              return guest;
            }
            // For full objects, ensure they have all required fields
            return {
              id: guest.id || guest._id || "",
              _id: guest._id || guest.id || "",
              name: guest.name || "Unnamed Guest",
              email: guest.email || '',
              phone: guest.phone || '',
              type: guest.type || 'adult'
            };
          })
        };
      }).filter(Boolean) || [];
    } catch (relationshipError) {
      console.error("Error processing relationships:", relationshipError);
      console.error("Relationship data:", JSON.stringify(guestRelationships));
      processedRelationships = []; // Fallback to empty array if processing fails
    }

    // Create the trip with the chat reference and guest relationships
    const newTrip = new Trip({
      userId: req.user.id,
      tripName,
      destination: destination || location,
      startDate,
      endDate,
      lodgings: lodgings || [],
      guests: processedGuests,
      guestRelationships: processedRelationships,
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
    
    // Provide more detailed error information
    if (error.name === 'ValidationError') {
      console.error("Validation error details:", error.errors);
      return res.status(400).json({ 
        error: "Validation error", 
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      return res.status(409).json({ error: "Duplicate key error" });
    }
    
    res.status(500).json({ error: "Server error" });
  }
});

// Helper function to check user's trip access level
const checkTripAccess = async (tripId, userId) => {
  const trip = await Trip.findById(tripId);
  if (!trip) return null;

  if (trip.userId.toString() === userId) return "owner";
  
  const collaborator = trip.collaborators.find(c => c.user.toString() === userId);
  if (collaborator) return collaborator.role;
  
  if (trip.isPublic) return "viewer";
  
  return null;
};

// Middleware to check trip access
const tripAccessMiddleware = (requiredRole) => async (req, res, next) => {
  try {
    const tripId = req.params.tripId;
    const userId = req.user.id;
    
    const accessLevel = await checkTripAccess(tripId, userId);
    
    if (!accessLevel) {
      return res.status(403).json({ error: "Unauthorized access to trip" });
    }
    
    // Define role hierarchy
    const roleHierarchy = {
      owner: 4,
      admin: 3,
      editor: 2,
      viewer: 1
    };
    
    if (roleHierarchy[accessLevel] >= roleHierarchy[requiredRole]) {
      req.userTripRole = accessLevel;
      next();
    } else {
      res.status(403).json({ error: "Insufficient permissions" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error checking permissions" });
  }
};

// Get user's trips (including ones they have access to)
router.get("/userTrips", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Find trips where user is owner or collaborator
    const trips = await Trip.find({
      $or: [
        { userId: userId },
        { 'collaborators.user': userId },
        { isPublic: true }
      ]
    })
    .populate('chat')
    .populate({
      path: 'experiences',
      populate: {
        path: 'chat',
        model: 'Chat'
      }
    })
    .populate('collaborators.user', 'name email');

    console.log("Populated trips:", JSON.stringify(trips, null, 2));
    res.json({ trips });
  } catch (error) {
    console.error("Error in userTrips:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update the delete trip route to clean up associated data
router.delete("/:tripId", authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.params;

    // Find the trip and populate chats
    const trip = await Trip.findById(tripId)
      .populate('chat')
      .populate('experiences.chat');

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Check if user is the owner
    if (trip.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the trip owner can delete the trip" });
    }

    // Delete the main trip chat
    if (trip.chat) {
      await Chat.findByIdAndDelete(trip.chat._id);
    }

    // Delete all experience chats
    for (const experience of trip.experiences) {
      if (experience.chat) {
        await Chat.findByIdAndDelete(experience.chat._id);
      }
    }

    // Delete any uploaded files associated with experiences
    for (const experience of trip.experiences) {
      if (experience.attachments && experience.attachments.length > 0) {
        for (const attachment of experience.attachments) {
          try {
            if (attachment.path) {
              fs.unlinkSync(attachment.path);
            }
          } catch (err) {
            console.error(`Error deleting file ${attachment.path}:`, err);
            // Continue with deletion even if file removal fails
          }
        }
      }
    }

    // Delete the trip itself
    await Trip.findByIdAndDelete(tripId);

    res.json({ message: "Trip and all associated data deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
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
router.get("/chat/:chatId", authMiddleware, async (req, res) => {
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

// Add collaborator to trip
router.post("/:tripId/collaborators", authMiddleware, tripAccessMiddleware("admin"), async (req, res) => {
  try {
    const { email, role } = req.body;
    const tripId = req.params.tripId;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user is already a collaborator
    const trip = await Trip.findById(tripId);
    if (trip.collaborators.some(c => c.user.toString() === user._id.toString())) {
      return res.status(400).json({ error: "User is already a collaborator" });
    }

    // Add collaborator
    trip.collaborators.push({
      user: user._id,
      role: role || "viewer"
    });

    // Add user to trip chat
    if (trip.chat) {
      await Chat.findByIdAndUpdate(trip.chat, {
        $addToSet: { members: user._id }
      });
    }

    await trip.save();
    res.json({ message: "Collaborator added successfully", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update collaborator role
router.put("/:tripId/collaborators/:userId", authMiddleware, tripAccessMiddleware("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const { tripId, userId } = req.params;

    const trip = await Trip.findById(tripId);
    const collaborator = trip.collaborators.find(c => c.user.toString() === userId);
    
    if (!collaborator) {
      return res.status(404).json({ error: "Collaborator not found" });
    }

    collaborator.role = role;
    await trip.save();

    res.json({ message: "Collaborator role updated", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Remove collaborator
router.delete("/:tripId/collaborators/:userId", authMiddleware, tripAccessMiddleware("admin"), async (req, res) => {
  try {
    const { tripId, userId } = req.params;

    const trip = await Trip.findById(tripId);
    trip.collaborators = trip.collaborators.filter(c => c.user.toString() !== userId);

    // Remove user from trip chat
    if (trip.chat) {
      await Chat.findByIdAndUpdate(trip.chat, {
        $pull: { members: userId }
      });
    }

    await trip.save();
    res.json({ message: "Collaborator removed", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Generate invite code
router.post("/:tripId/invite-code", authMiddleware, tripAccessMiddleware("admin"), async (req, res) => {
  try {
    const tripId = req.params.tripId;
    const inviteCode = Math.random().toString(36).substring(2, 15);

    const trip = await Trip.findByIdAndUpdate(tripId, 
      { inviteCode }, 
      { new: true }
    );

    res.json({ inviteCode: trip.inviteCode });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Join trip with invite code
router.post("/join/:inviteCode", authMiddleware, async (req, res) => {
  try {
    const { inviteCode } = req.params;
    const userId = req.user.id;

    const trip = await Trip.findOne({ inviteCode });
    if (!trip) {
      return res.status(404).json({ error: "Invalid invite code" });
    }

    // Check if user is already a collaborator
    if (trip.collaborators.some(c => c.user.toString() === userId)) {
      return res.status(400).json({ error: "Already a member of this trip" });
    }

    // Add user as viewer
    trip.collaborators.push({
      user: userId,
      role: "viewer"
    });

    // Add to trip chat
    if (trip.chat) {
      await Chat.findByIdAndUpdate(trip.chat, {
        $addToSet: { members: userId }
      });
    }

    await trip.save();
    res.json({ message: "Successfully joined trip", trip });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Send invitations to selected guests
router.post("/:tripId/send-invitations", authMiddleware, tripAccessMiddleware("admin"), async (req, res) => {
  try {
    const { tripId } = req.params;
    const { guests, inviteMethod, customMessage, inviteCode, joinLink } = req.body;
    
    console.log("📧 Send invitations endpoint hit:", { 
      tripId, 
      guestsCount: guests?.length, 
      inviteMethod, 
      messageLength: customMessage?.length,
      providedInviteCode: inviteCode,
      providedJoinLink: joinLink
    });
    console.log("📧 Guest data received:", JSON.stringify(guests, null, 2));
    
    // Get trip details
    const trip = await Trip.findById(tripId);
    if (!trip) {
      console.error("Trip not found:", tripId);
      return res.status(404).json({ error: "Trip not found" });
    }
    
    // Generate invite code if not already present
    if (!trip.inviteCode && !inviteCode) {
      trip.inviteCode = Math.random().toString(36).substring(2, 15);
      await trip.save();
      console.log("Generated new invite code:", trip.inviteCode);
    } else if (inviteCode) {
      trip.inviteCode = inviteCode;
      await trip.save();
      console.log("Using provided invite code:", inviteCode);
    }
    
    // Get sender details
    const sender = await User.findById(req.user.id);
    console.log("Sender details:", { name: sender.name, email: sender.email });
    
    // Process each guest
    const results = [];
    for (const guest of guests) {
      try {
        console.log("Processing guest invitation:", { name: guest.name, email: guest.email, phone: guest.phone });
        
        // Skip if no contact information for the selected method
        if (inviteMethod === "email" && !guest.email) {
          console.log(`Skipping ${guest.name}: No email address`);
          results.push({ name: guest.name, status: "skipped", error: "No email address" });
          continue;
        } else if (inviteMethod === "sms" && !guest.phone) {
          console.log(`Skipping ${guest.name}: No phone number`);
          results.push({ name: guest.name, status: "skipped", error: "No phone number" });
          continue;
        }
        
        if (inviteMethod === "email") {
          // Send email invitation
          console.log(`Sending email to ${guest.email} for ${guest.name}`);
          await sendTripInvitationEmail({
            to: guest.email,
            tripName: trip.tripName || trip.name, // Handle both field names
            inviteCode: trip.inviteCode,
            customMessage,
            senderName: sender.name,
          });
          console.log(`Email sent successfully to ${guest.email}`);
        } else if (inviteMethod === "sms") {
          // Send SMS invitation
          console.log(`Sending SMS to ${guest.phone} for ${guest.name}`);
          await sendTripInvitationSMS({
            to: guest.phone,
            tripName: trip.tripName || trip.name, // Handle both field names
            inviteCode: trip.inviteCode,
            customMessage,
            senderName: sender.name,
          });
          console.log(`SMS sent successfully to ${guest.phone}`);
        }
        
        // Update guest invitation status in the trip
        const guestIndex = trip.guests.findIndex(g => g.name === guest.name);
        if (guestIndex !== -1) {
          trip.guests[guestIndex].invitationSent = true;
          trip.guests[guestIndex].invitationDate = new Date();
          trip.guests[guestIndex].invitationMethod = inviteMethod;
        }
        
        results.push({ name: guest.name, status: "sent" });
      } catch (error) {
        console.error(`Error inviting ${guest.name}:`, error);
        results.push({ name: guest.name, status: "failed", error: error.message });
      }
    }
    
    // Save updated trip
    await trip.save();
    
    res.status(200).json({ 
      message: "Invitations processed",
      inviteCode: trip.inviteCode, 
      results 
    });
  } catch (error) {
    console.error("Error sending invitations:", error);
    res.status(500).json({ error: "Failed to send invitations" });
  }
});

// Get public trip details by invite code (no auth required)
router.get("/details/:inviteCode", async (req, res) => {
  try {
    const { inviteCode } = req.params;
    
    // Find trip by invite code
    const trip = await Trip.findOne({ inviteCode })
      .populate('userId', 'name email')
      .select('tripName destination startDate endDate inviteCode userId');
    
    if (!trip) {
      return res.status(404).json({ error: "Trip not found or invitation has expired" });
    }
    
    // Return limited details for public viewing
    res.json({
      id: trip._id,
      name: trip.tripName,
      destination: trip.destination,
      dates: {
        start: trip.startDate,
        end: trip.endDate
      },
      organizer: trip.userId ? {
        name: trip.userId.name,
        id: trip.userId._id
      } : undefined
    });
  } catch (error) {
    console.error("Error getting trip details by invite code:", error);
    res.status(500).json({ error: "Failed to get trip details" });
  }
});

module.exports = router;
