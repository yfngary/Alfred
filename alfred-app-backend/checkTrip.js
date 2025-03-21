const mongoose = require('mongoose');
const Trip = require('./models/Trip');

mongoose.connect('mongodb://localhost:27017/alfred-app').then(async () => {
  try {
    const trip = await Trip.findById('67db19f0142eeb13d75ccc0c');
    console.log('Found trip:', JSON.stringify(trip, null, 2));
    
    // Also check by invite code
    const tripByInvite = await Trip.findOne({ inviteCode: 'nbxj9jko1or' });
    console.log('\nFound by invite code:', JSON.stringify(tripByInvite, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.disconnect();
  }
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
}); 