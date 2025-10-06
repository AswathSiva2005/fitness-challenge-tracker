const express = require('express');
const auth = require('../middleware/auth');
const ChatBotMessage = require('../models/ChatBotMessage');

const router = express.Router();

// Get last 20 messages for current user
router.get('/history', auth, async (req, res) => {
  try {
    const messages = await ChatBotMessage.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json({ success: true, data: messages.reverse() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Simple rule-based assistant response
function generateAssistantResponse(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('diet') || t.includes('nutrition')) {
    return 'Aim for a balanced plate: lean protein, complex carbs, healthy fats, and plenty of veggies. Track hydration too!';
  }
  if (t.includes('workout') || t.includes('exercise')) {
    return 'Try alternating push/pull/legs across the week with 48h rest per muscle group. Progressive overload is key.';
  }
  if (t.includes('schedule') || t.includes('plan')) {
    return 'A solid weekly plan: 3 strength days, 2 cardio days, 2 rest/recovery days with mobility.';
  }
  if (t.includes('calorie') || t.includes('calories')) {
    return 'A rough TDEE estimate can guide your intake. Consider a 300–500 kcal deficit for fat loss, surplus for muscle gain.';
  }
  return "I'm here to help with fitness, workouts, and nutrition. Ask me about training splits, diet tips, or recovery!";
}

// Send a message and get assistant reply
router.post('/message', auth, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    const userMsg = await ChatBotMessage.create({ user: req.user._id, role: 'user', text: text.trim() });
    const replyText = generateAssistantResponse(text);
    const assistantMsg = await ChatBotMessage.create({ user: req.user._id, role: 'assistant', text: replyText });

    res.json({ success: true, data: { user: userMsg, assistant: assistantMsg } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;


