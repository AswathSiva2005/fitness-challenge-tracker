const connectDB = require('../config/db');
const ChatRoom = require('../models/ChatRoom');

(async () => {
  try {
    await connectDB();

    const existingCount = await ChatRoom.countDocuments();
    if (existingCount > 0) {
      console.log(`Rooms already exist (${existingCount}). Skipping seed.`);
      process.exit(0);
    }

    const rooms = [
      { name: 'General Fitness', description: 'Chat about overall fitness', isPublic: true },
      { name: 'Nutrition', description: 'Discuss diets and meal plans', isPublic: true },
      { name: 'Running', description: 'Runners community', isPublic: true },
    ];

    await ChatRoom.insertMany(rooms);
    console.log('✅ Seeded chat rooms:', rooms.map(r => r.name).join(', '));
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed chat rooms:', err.message);
    process.exit(1);
  }
})();


