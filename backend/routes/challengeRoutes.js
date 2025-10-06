const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const requireTrainer = require('../middleware/requireTrainer');
const auth = require('../middleware/auth');
const challengeController = require('../controllers/challengeController');

// Validation middleware
const createChallengeValidation = [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('challengeType', 'Please provide a valid challenge type')
        .isIn(['steps', 'workouts', 'distance', 'calories', 'active_minutes']),
    check('targetValue', 'Please provide a valid target value').isNumeric().isInt({ min: 1 }),
    check('startDate', 'Please provide a valid start date').isISO8601(),
    check('endDate', 'Please provide a valid end date').isISO8601()
];

const updateProgressValidation = [
    check('progress', 'Please provide a valid progress value').isNumeric().isInt({ min: 0 })
];

// Public routes - accessible without authentication
router.get('/', challengeController.getChallenges);
router.get('/:id', challengeController.getChallenge);

// Protected routes (require authentication)
router.use(auth);

// Challenge management routes
router.post('/', requireTrainer, createChallengeValidation, challengeController.createChallenge);
router.get('/user/me', challengeController.getUserChallenges);
router.post('/:id/join', challengeController.joinChallenge);
router.put('/:id/progress', updateProgressValidation, challengeController.updateProgress);
router.delete('/:id', challengeController.deleteChallenge);

// Trainer approves a participant's completion
router.put('/:id/approve/:participantId', requireTrainer, async (req, res) => {
    const { id, participantId } = req.params;
    try {
        const challenge = await require('../models/Challenge').findById(id);
        if (!challenge) return res.status(404).json({ success:false, error:'Challenge not found' });
        // Only the trainer who created the challenge can approve
        if (challenge.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success:false, error:'Only the creator trainer can approve' });
        }
        const participant = challenge.participants.id(participantId) || challenge.participants.find(p => p.user?.toString() === participantId);
        if (!participant) return res.status(404).json({ success:false, error:'Participant not found' });
        if (!participant.completed) return res.status(400).json({ success:false, error:'Participant has not completed target' });
        participant.approvedByTrainer = true;
        participant.approvedAt = new Date();
        participant.approvedBy = req.user._id;
        await challenge.save();
        return res.json({ success:true, data:{ participantId: participantId, approved: true } });
    } catch (e) {
        return res.status(500).json({ success:false, error:e.message });
    }
});

// Trainer declares winner and sends notification
router.post('/:id/winner', requireTrainer, async (req, res) => {
    try {
        const { winnerUserId, message } = req.body || {};
        const Challenge = require('../models/Challenge');
        const Notification = require('../models/Notification');
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) return res.status(404).json({ success:false, error:'Challenge not found' });
        if (challenge.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success:false, error:'Only the creator trainer can declare a winner' });
        }
        // Ensure user is a participant and approved
        const participant = challenge.participants.find(p => p.user?.toString() === winnerUserId);
        if (!participant) return res.status(400).json({ success:false, error:'Winner must be a participant' });
        if (!participant.approvedByTrainer) return res.status(400).json({ success:false, error:'Winner must be approved by trainer first' });

        challenge.winnerUser = winnerUserId;
        challenge.winnerMessage = message || 'Congratulations, you are the winner!';
        challenge.winnerAnnouncedAt = new Date();
        await challenge.save();

        // Notify winner
        try {
            await Notification.create({
                recipient: winnerUserId,
                sender: req.user._id,
                type: 'challenge_winner',
                title: 'You won a challenge!',
                message: challenge.winnerMessage,
                challenge: challenge._id
            });
        } catch {}
        res.json({ success:true, data:{ winnerUserId, message: challenge.winnerMessage } });
    } catch (e) {
        res.status(500).json({ success:false, error:e.message });
    }
});

// Leaderboard route
router.get('/leaderboard/:id', [
    check('id', 'Please provide a valid challenge ID').isMongoId()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const challenge = await Challenge.findById(req.params.id)
            .select('participants targetValue challengeType title')
            .populate('participants.user', 'username');

        if (!challenge) {
            return res.status(404).json({ msg: 'Challenge not found' });
        }

        // Sort participants by progress (descending)
        const leaderboard = challenge.participants
            .sort((a, b) => b.progress - a.progress)
            .map(participant => ({
                user: {
                    id: participant.user._id,
                    username: participant.user.username
                },
                progress: participant.progress,
                percentage: Math.min(100, Math.round((participant.progress / challenge.targetValue) * 100)),
                lastUpdated: participant.lastUpdated
            }));

        res.json({
            challenge: {
                id: challenge._id,
                title: challenge.title,
                target: challenge.targetValue,
                unit: challenge.challengeType
            },
            leaderboard
        });
    } catch (err) {
        console.error('Error getting leaderboard:', err);
        res.status(500).send('Server error');
    }
});

module.exports = router;
