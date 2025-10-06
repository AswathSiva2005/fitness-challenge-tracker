const express = require("express");
const path = require('path');
const multer = require('multer');
const { createUser, getUsers, getMe, updateMe, uploadAvatar } = require("../controllers/userController");
const auth = require('../middleware/auth');
const router = express.Router();

// Public
router.post("/", createUser);
router.get("/", getUsers);

// Protected profile routes
router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);

// Multer storage for avatars
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), 'uploads'));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `avatar_${req.user._id}_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

router.post('/me/avatar', auth, upload.single('avatar'), uploadAvatar);

module.exports = router;
