const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // changed to String
  type: { type: String, required: true },
  duration: { type: Number, required: true },
  calories: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Workout", workoutSchema);
