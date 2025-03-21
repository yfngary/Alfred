const { sendTripInvitationEmail } = require('./utils/emailService');

async function testEmail() {
  try {
    console.log('Sending test email...');
    const result = await sendTripInvitationEmail({
      to: 'kalebglundquist@gmail.com',
      tripName: 'Test Trip',
      inviteCode: 'test123',
      customMessage: 'This is a test invitation message. Please ignore.',
      senderName: 'Test User',
    });
    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

testEmail(); 