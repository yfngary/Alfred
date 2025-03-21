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

module.exports = {
  sendTripInvitationEmail,
}; 