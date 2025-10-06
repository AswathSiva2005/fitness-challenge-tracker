const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { validationResult } = require('express-validator');

// @desc    Create a new challenge
// @route   POST /api/challenges
// @access  Private
exports.createChallenge = async (req, res) => {
    console.log('\n=== CHALLENGE CREATION STARTED ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Authenticated user ID:', req.user?.id);
    
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('❌ Validation errors:', errors.array());
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        // Extract challenge data
        const {
            title,
            description,
            challengeType,
            targetValue,
            startDate,
            endDate,
            isPublic = true,
            maxParticipants,
            coverImage,
            rewards,
            assignedUsers = []
        } = req.body;

        console.log('\n=== PARSED CHALLENGE DATA ===');
        console.log('Title:', title);
        console.log('Type:', challengeType);
        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);
        console.log('Target Value:', targetValue);
        console.log('Is Public:', isPublic);
        console.log('Max Participants:', maxParticipants);
        console.log('Cover Image:', coverImage);
        console.log('Rewards:', rewards);

        // Create the challenge object
        const challengeData = {
            title,
            description,
            challengeType,
            targetValue: Number(targetValue),
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isPublic,
            createdBy: req.user.id,
            participants: [{
                user: req.user.id,
                progress: 0,
                joinedAt: new Date()
            }]
        };

        // Add optional fields if they exist
        if (maxParticipants) challengeData.maxParticipants = Number(maxParticipants);
        if (coverImage) challengeData.coverImage = coverImage;
        if (rewards) challengeData.rewards = rewards;

        console.log('\n=== CHALLENGE DATA TO SAVE ===');
        console.log(JSON.stringify(challengeData, null, 2));

        // Create and save the challenge
        console.log('\n=== SAVING CHALLENGE TO DATABASE ===');
        // If assignedUsers provided (private or targeted challenge), add participants initially
        if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
            challengeData.participants = assignedUsers.map(u => ({ user: u, progress: 0, completed: false }));
        }

        const challenge = new Challenge(challengeData);
        const savedChallenge = await challenge.save();
        
        console.log('✅ Challenge saved successfully!');
        console.log('Saved challenge ID:', savedChallenge._id);
        
        // Populate the createdBy field for the response
        await savedChallenge.populate('createdBy', 'name email');
        
        // Send notifications to assigned users
        try {
            if (assignedUsers && assignedUsers.length > 0) {
                // Get all users to notify
                const usersToNotify = await User.find({ _id: { $in: assignedUsers } });
                
                // Create notifications for each assigned user
                const notifications = usersToNotify.map(user => ({
                    recipient: user._id,
                    sender: req.user.id,
                    type: 'challenge_created',
                    title: 'New Challenge Assigned to You',
                    message: `${req.user.username} created a new challenge "${savedChallenge.title}" and assigned it to you`,
                    challenge: savedChallenge._id
                }));
                
                await Notification.insertMany(notifications);
                console.log(`✅ Notifications sent to ${notifications.length} assigned users`);
            } else {
                // If no specific users assigned, it's a public challenge
                // We could notify all users, but that might be spammy
                console.log('✅ Public challenge created - no specific user notifications sent');
            }
        } catch (notificationError) {
            console.error('Error sending notifications:', notificationError);
            // Don't fail the challenge creation if notifications fail
        }
        
        res.status(201).json({
            success: true,
            message: 'Challenge created successfully!',
            challenge: savedChallenge
        });
    } catch (error) {
        console.error('❌ Error creating challenge:', error);
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: 'Validation error',
                errors: messages
            });
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A challenge with this title already exists',
                error: error.message
            });
        }
        
        // General error handling
        res.status(500).json({
            success: false,
            message: 'Failed to create challenge',
            error: error.message,
            ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
        });
    }
};

// @desc    Get all challenges
// @route   GET /api/challenges
// @access  Public
exports.getChallenges = async (req, res) => {
    try {
        const { status, type, search, page = 1, limit = 10 } = req.query;
        const query = {};
        
        // Filter by status
        if (status && ['active', 'upcoming', 'completed'].includes(status)) {
            query.status = status;
        }
        
        // Filter by challenge type
        if (type) {
            query.challengeType = type;
        }
        
        // Search by title or description
        if (search) {
            query.$text = { $search: search };
        }
        
        // Only show public challenges to non-authenticated users
        if (!req.user) {
            query.isPublic = true;
        }
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [challenges, total] = await Promise.all([
            Challenge.find(query)
                .populate('createdBy', 'username name email')
                .populate('participants.user', 'username name')
                .sort({ createdAt: -1 }) // Show newest first
                .skip(skip)
                .limit(parseInt(limit)),
            Challenge.countDocuments(query)
        ]);
        
        res.status(200).json({
            success: true,
            count: challenges.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: challenges
        });
    } catch (error) {
        console.error('Error getting challenges:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Get single challenge
// @route   GET /api/challenges/:id
// @access  Public
exports.getChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id)
            .populate('createdBy', 'name email avatar')
            .populate('participants.user', 'name avatar');
            
        if (!challenge) {
            return res.status(404).json({
                success: false,
                error: 'Challenge not found'
            });
        }
        
        // Check if user is a participant
        let isParticipant = false;
        let userProgress = null;
        
        if (req.user) {
            const participant = challenge.participants.find(
                p => p.user && p.user._id.toString() === req.user.id
            );
            
            if (participant) {
                isParticipant = true;
                userProgress = {
                    progress: participant.progress,
                    completed: participant.completed,
                    completedAt: participant.completedAt,
                    lastUpdated: participant.lastUpdated
                };
            }
        }
        
        // Prepare response
        const response = {
            ...challenge.toObject(),
            isParticipant,
            userProgress
        };
        
        res.status(200).json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Error getting challenge:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Join a challenge
// @route   POST /api/challenges/:id/join
// @access  Private
exports.joinChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                error: 'Challenge not found'
            });
        }
        
        // Check if challenge is not completed and is active
        if (challenge.isCompleted()) {
            return res.status(400).json({
                success: false,
                error: 'This challenge has already ended'
            });
        }
        
        if (!challenge.isActive) {
            return res.status(400).json({
                success: false,
                error: 'This challenge is not active'
            });
        }
        
        // Check if user is already a participant
        const isAlreadyParticipant = challenge.participants.some(
            p => p.user && p.user.toString() === req.user.id
        );
        
        if (isAlreadyParticipant) {
            return res.status(400).json({
                success: false,
                error: 'You have already joined this challenge'
            });
        }
        
        // Check if challenge has reached max participants
        if (challenge.maxParticipants && 
            challenge.participants.length >= challenge.maxParticipants) {
            return res.status(400).json({
                success: false,
                error: 'This challenge has reached the maximum number of participants'
            });
        }
        
        // Add user as participant
        challenge.participants.push({
            user: req.user.id,
            progress: 0,
            completed: false
        });
        
        await challenge.save();
        
        // Create notification for challenge creator
        try {
            const notification = new Notification({
                recipient: challenge.createdBy,
                sender: req.user.id,
                type: 'challenge_joined',
                title: 'New Participant Joined Your Challenge',
                message: `${req.user.username} joined your challenge "${challenge.title}"`,
                challenge: challenge._id
            });
            
            await notification.save();
            console.log('Notification created for challenge creator');
        } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
            // Don't fail the join operation if notification fails
        }
        
        res.status(200).json({
            success: true,
            message: 'Successfully joined the challenge',
            data: challenge
        });
    } catch (error) {
        console.error('Error joining challenge:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Update challenge progress
// @route   PUT /api/challenges/:id/progress
// @access  Private
exports.updateProgress = async (req, res) => {
    try {
        const { progress } = req.body;
        
        if (typeof progress !== 'number' || progress < 0) {
            return res.status(400).json({
                success: false,
                error: 'Please provide a valid progress value'
            });
        }
        
        const challenge = await Challenge.findById(req.params.id);
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                error: 'Challenge not found'
            });
        }
        
        // Check if user is a participant
        const participantIndex = challenge.participants.findIndex(
            p => p.user && p.user.toString() === req.user.id
        );
        
        if (participantIndex === -1) {
            return res.status(403).json({
                success: false,
                error: 'You are not a participant of this challenge'
            });
        }
        
        // Update progress
        const participant = challenge.participants[participantIndex];
        participant.progress = progress;
        participant.lastUpdated = Date.now();
        
        // Check if challenge is completed
        if (progress >= challenge.targetValue && !participant.completed) {
            participant.completed = true;
            participant.completedAt = Date.now();
            // Reset trainer approval when status changes to completed pending approval
            participant.approvedByTrainer = false;
            participant.approvedAt = undefined;
            participant.approvedBy = undefined;
        } else if (progress < challenge.targetValue && participant.completed) {
            // If progress is reduced below target, mark as not completed
            participant.completed = false;
            participant.completedAt = undefined;
            participant.approvedByTrainer = false;
            participant.approvedAt = undefined;
            participant.approvedBy = undefined;
        }
        
        await challenge.save();
        
        res.status(200).json({
            success: true,
            message: 'Progress updated successfully',
            data: {
                progress: participant.progress,
                completed: participant.completed,
                completedAt: participant.completedAt,
                lastUpdated: participant.lastUpdated
            }
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Get user's challenges
// @route   GET /api/challenges/user/me
// @access  Private
exports.getUserChallenges = async (req, res) => {
    try {
        const { status } = req.query;
        const query = { 'participants.user': req.user.id };
        
        if (status && ['active', 'upcoming', 'completed'].includes(status)) {
            query.status = status;
        }
        
        const challenges = await Challenge.find(query)
            .populate('createdBy', 'name avatar')
            .sort({ startDate: 1 });
            
        // Add user's progress to each challenge
        const challengesWithProgress = challenges.map(challenge => {
            const participant = challenge.participants.find(
                p => p.user && p.user.toString() === req.user.id
            );
            
            return {
                ...challenge.toObject(),
                userProgress: {
                    progress: participant.progress,
                    completed: participant.completed,
                    completedAt: participant.completedAt,
                    lastUpdated: participant.lastUpdated
                }
            };
        });
        
        res.status(200).json({
            success: true,
            count: challenges.length,
            data: challengesWithProgress
        });
    } catch (error) {
        console.error('Error getting user challenges:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};

// @desc    Delete a challenge
// @route   DELETE /api/challenges/:id
// @access  Private (Admin/Challenge Creator)
exports.deleteChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        
        if (!challenge) {
            return res.status(404).json({
                success: false,
                error: 'Challenge not found'
            });
        }
        
        // Check if user is the creator (trainer)
        if (challenge.createdBy.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to delete this challenge'
            });
        }
        
        await challenge.remove();
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.error('Error deleting challenge:', error);
        res.status(500).json({
            success: false,
            error: 'Server error'
        });
    }
};
