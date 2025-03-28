const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send an invitation email to a guest
 * @param {Object} options - The email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.tripName - Name of the trip
 * @param {string} options.inviteCode - Invitation code
 * @param {string} options.customMessage - Custom message from trip organizer
 * @param {string} options.senderName - Name of the person sending the invitation
 * @returns {Promise} - Nodemailer send result
 */
const sendTripInvitationEmail = async ({
  to,
  subject = 'You\'ve Been Invited to Join a Trip!',
  tripName,
  inviteCode,
  customMessage,
  senderName,
}) => {
  // Create the invitation URL
  const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join-trip/${inviteCode}`;

  const mailOptions = {
    from: `"Alfred Trip App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4a90e2;">Trip Invitation</h2>
        <p>Hi there!</p>
        <p>${senderName || 'Someone'} has invited you to join their trip${tripName ? ` to <strong>${tripName}</strong>` : ''}!</p>
        
        ${customMessage ? `<p><em>"${customMessage}"</em></p>` : ''}
        
        <p>Click the button below to join the trip and start planning together:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${invitationUrl}" style="background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Join Trip</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4a90e2;">${invitationUrl}</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          This invitation was sent using Alfred Trip App. If you didn't expect this invitation, you can ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Send an email verification link to a newly registered user
 * @param {Object} options - The email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - User's name
 * @param {string} options.verificationToken - Email verification token
 * @returns {Promise} - Nodemailer send result
 */
const sendVerificationEmail = async ({
  to,
  name,
  verificationToken
}) => {
  // Create the verification URL
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email/${verificationToken}`;

  const mailOptions = {
    from: `"Alfred App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4a90e2;">Email Verification</h2>
        <p>Hi ${name || 'there'}!</p>
        <p>Thank you for registering with Alfred App. To complete your registration, please verify your email address by clicking the button below:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${verificationUrl}" style="background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4a90e2;">${verificationUrl}</p>
        
        <p>This verification link will expire in 24 hours.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          If you didn't create an account with Alfred App, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

/**
 * Send a password reset email to a user
 * @param {Object} options - The email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.name - User's name
 * @param {string} options.resetToken - Password reset token
 * @returns {Promise} - Nodemailer send result
 */
const sendPasswordResetEmail = async ({
  to,
  name,
  resetToken
}) => {
  // Create the reset URL
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  const mailOptions = {
    from: `"Alfred App" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #4a90e2;">Password Reset</h2>
        <p>Hi ${name || 'there'}!</p>
        <p>You recently requested to reset your password for your Alfred App account. Click the button below to reset it:</p>
        
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #4a90e2;">${resetUrl}</p>
        
        <p>This password reset link will expire in 1 hour.</p>
        
        <p style="margin-top: 30px; font-size: 12px; color: #999;">
          If you didn't request a password reset, please ignore this email or contact support if you have concerns.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

module.exports = {
  sendTripInvitationEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
}; 