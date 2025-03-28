const express = require("express");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const User = require("../models/User");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto"); // Add for token generation
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailService"); // Import email service

const router = express.Router();

// Multer setup for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// ✅ Registration Route
router.post("/register", upload.single("profilePicture"), async (req, res) => {
  try {
    const { username, name, email, password, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already in use" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24); // Token valid for 24 hours

    // Save new user with verification fields
    const newUser = new User({
      username,
      name,
      email,
      password: hashedPassword,
      phone,
      profilePicture: req.file ? req.file.path : null,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: tokenExpiration
    });

    await newUser.save();

    // Send verification email
    try {
      await sendVerificationEmail({
        to: email,
        name: name,
        verificationToken: verificationToken
      });
      
      res.status(201).json({ 
        message: "User registered successfully. Please check your email to verify your account." 
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Even if email fails, user is registered
      res.status(201).json({ 
        message: "User registered successfully, but there was an issue sending the verification email. Please contact support." 
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error(""));

// User Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        error: "Email not verified",
        message: "Please verify your email address before logging in."
      });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({ message: "Login successful", token, user: { name: user.name, email: user.email, id: user._id } });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Email Verification Route
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user with this verification token
    const user = await User.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Invalid or expired verification token",
        message: "Your verification link is invalid or has expired. Please request a new one."
      });
    }

    // Update user to verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Redirect to frontend with success message
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?verified=true`);
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Resend Verification Email Route
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }
    
    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 24); // Token valid for 24 hours
    
    // Update user with new verification token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = tokenExpiration;
    await user.save();
    
    // Send verification email
    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationToken: verificationToken
    });
    
    res.json({ message: "Verification email resent successfully" });
  } catch (error) {
    console.error("Resend Verification Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Forgot Password Route - Send reset link via email
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, we still return success even if email is not found
      return res.json({ message: "If your email exists in our system, you will receive a password reset link." });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiration = new Date();
    tokenExpiration.setHours(tokenExpiration.getHours() + 1); // Token valid for 1 hour
    
    // Save token and expiration to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = tokenExpiration;
    await user.save();
    
    // Send password reset email
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetToken: resetToken
      });
      
      res.json({ message: "Password reset link sent to your email." });
    } catch (emailError) {
      console.error("Error sending password reset email:", emailError);
      res.status(500).json({ error: "Failed to send reset email. Please try again later." });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Verify Reset Token - Check if token is valid
router.get("/verify-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    // Find user with this reset token and ensure it's not expired
    const user = await User.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Invalid or expired reset token",
        message: "Your password reset link is invalid or has expired. Please request a new one."
      });
    }

    // Token is valid
    res.json({ message: "Token is valid" });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Reset Password Route - Update password with new one
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // Find user with this reset token and ensure it's not expired
    const user = await User.findOne({ 
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ 
        error: "Invalid or expired reset token",
        message: "Your password reset link is invalid or has expired. Please request a new one."
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Update user with new password and clear reset token fields
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    
    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
