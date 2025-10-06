const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true 
  },
  weight: { 
    type: Number, 
    required: true 
  },
  bodyFat: { 
    type: Number 
  },
  chest: { 
    type: Number 
  },
  waist: { 
    type: Number 
  },
  notes: { 
    type: String 
  },
  measurementDate: { 
    type: Date, 
    required: true,
    default: Date.now 
  }
}, {
  timestamps: true,
  collection: 'progresses' // Explicitly set the collection name
});

// Create the model with explicit collection name
const Progress = mongoose.model("Progress", progressSchema);
module.exports = Progress;
