const Workout = require("../models/Workout");

exports.createWorkout = async (req, res) => {
  try {
    console.log("Incoming Workout:", req.body);
    const workout = await Workout.create(req.body);
    res.json(workout);
  } catch (err) {
    console.error("Workout Error:", err);
    res.status(400).json({ error: err.message });
  }
};

exports.getWorkouts = async (req, res) => {
  const workouts = await Workout.find().populate("userId");
  res.json(workouts);
};
