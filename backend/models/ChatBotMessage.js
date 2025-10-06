const mongoose = require('mongoose');

const chatBotMessageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], default: 'user' },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('ChatBotMessage', chatBotMessageSchema);


