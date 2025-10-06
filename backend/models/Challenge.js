const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the challenge'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  challengeType: {
    type: String,
    required: [true, 'Please specify the type of challenge'],
    enum: {
      values: ['steps', 'workouts', 'distance', 'calories', 'active_minutes'],
      message: 'Challenge type is not supported'
    }
  },
  targetValue: {
    type: Number,
    required: [true, 'Please provide a target value for the challenge'],
    min: [1, 'Target value must be at least 1']
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Start date must be in the future'
    }
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
    validate: {
      validator: function(value) {
        return value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    // Trainer approval fields
    approvedByTrainer: { type: Boolean, default: false },
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // Winner announcement
  winnerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  winnerMessage: { type: String, default: null },
  winnerAnnouncedAt: { type: Date, default: null },
  maxParticipants: {
    type: Number,
    min: [2, 'Minimum 2 participants required'],
    max: [100, 'Maximum 100 participants allowed']
  },
  coverImage: {
    type: String,
    default: 'default-challenge.jpg'
  },
  rewards: {
    points: {
      type: Number,
      default: 0
    },
    badge: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['active', 'upcoming', 'completed'],
    default: 'upcoming'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
challengeSchema.index({ isActive: 1, endDate: 1 });
challengeSchema.index({ createdBy: 1, isActive: 1 });

// Virtual for duration in days
challengeSchema.virtual('durationInDays').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Check if challenge is active
challengeSchema.methods.isChallengeActive = function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now && this.isActive;
};

// Check if challenge is upcoming
challengeSchema.methods.isUpcoming = function() {
  return this.startDate > new Date() && this.isActive;
};

// Check if challenge is completed
challengeSchema.methods.isCompleted = function() {
  return this.endDate < new Date() || !this.isActive;
};

// Get participant progress
challengeSchema.methods.getParticipantProgress = function(userId) {
  const participant = this.participants.find(p => p.user && p.user.toString() === userId.toString());
  return participant ? {
    progress: participant.progress,
    completed: participant.completed,
    completedAt: participant.completedAt
  } : null;
};

// Update status before saving
challengeSchema.pre('save', function(next) {
  const now = new Date();
  if (this.startDate > now) {
    this.status = 'upcoming';
  } else if (this.endDate < now) {
    this.status = 'completed';
  } else {
    this.status = 'active';
  }
  next();
});

// Add text index for search functionality
challengeSchema.index({ title: 'text', description: 'text' });

const Challenge = mongoose.model('Challenge', challengeSchema);
module.exports = Challenge;
