const twilio = require('twilio');
require('dotenv').config();

// Don't initialize Twilio client immediately - do it when needed
let twilioClient = null;

// Function to get or create Twilio client
const getTwilioClient = () => {
  // If Twilio is disabled, return null
  if (process.env.TWILIO_ACCOUNT_SID === 'disabled' || !process.env.TWILIO_ACCOUNT_SID) {
    return null;
  }
  
  // If client already exists, return it
  if (twilioClient) {
    return twilioClient;
  }
  
  // Create new client only when needed and credentials are available
  try {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    return twilioClient;
  } catch (error) {
    console.error('Error initializing Twilio client:', error);
    return null;
  }
};

/**
 * Send an invitation SMS to a guest
 * @param {Object} options - The SMS options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.tripName - Name of the trip
 * @param {string} options.inviteCode - Invitation code
 * @param {string} options.customMessage - Custom message from trip organizer
 * @param {string} options.senderName - Name of the person sending the invitation
 * @returns {Promise} - Twilio send result or error message
 */
const sendTripInvitationSMS = async ({
  to,
  tripName,
  inviteCode,
  customMessage,
  senderName,
}) => {
  // Get Twilio client (or null if disabled)
  const client = getTwilioClient();
  
  // Check if SMS service is disabled
  if (!client) {
    console.log('SMS service is disabled');
    return { status: 'disabled', message: 'SMS service is currently disabled' };
  }

  // Create the invitation URL
  const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/join-trip/${inviteCode}`;
  
  // Format the phone number if needed (Twilio requires E.164 format)
  const formattedPhone = to.startsWith('+') ? to : `+${to}`;
  
  // Create the message body
  const messageBody = `${senderName || 'Someone'} has invited you to join their trip${
    tripName ? ` to ${tripName}` : ''
  }! ${customMessage ? `"${customMessage}" ` : ''}Join here: ${invitationUrl}`;

  try {
    const message = await client.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });
    
    console.log('SMS sent with SID:', message.sid);
    return message;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
};

module.exports = {
  sendTripInvitationSMS,
}; 