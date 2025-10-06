const express = require('express');
const ChatRoom = require('../models/ChatRoom');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// List public rooms and those the user participates in
router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({ $or: [ { isPublic: true }, { participants: req.user._id } ] })
      .select('name description isPublic participants')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: rooms });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Join a room
router.post('/rooms/:roomId/join', auth, async (req, res) => {
  try {
    const room = await ChatRoom.findByIdAndUpdate(
      req.params.roomId,
      { $addToSet: { participants: req.user._id } },
      { new: true }
    );
    if (!room) return res.status(404).json({ success: false, error: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// Get recent messages
router.get('/rooms/:roomId/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.roomId })
      .populate('sender', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: messages.reverse() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;


