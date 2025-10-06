const express = require("express");
const { 
  createProgress, 
  getProgress, 
  getProgressSummary 
} = require("../controllers/progressController");

const router = express.Router();

// Create new progress entry
router.post("/", createProgress);

// Get all progress entries for a user
router.get("/", getProgress);

// Get progress summary for dashboard
router.get("/summary", getProgressSummary);

module.exports = router;
