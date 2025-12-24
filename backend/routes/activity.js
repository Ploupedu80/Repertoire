const express = require('express');
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Middleware to check if logged in
function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
}

// Get user's activity
router.get('/', requireLogin, (req, res) => {
  const activities = readJSON('activity.json');
  const userActivities = activities.filter(a => a.userId === req.user.id);
  res.json(userActivities);
});

// Create activity (internal use)
router.post('/', (req, res) => {
  const { userId, type, title, message } = req.body;
  const activities = readJSON('activity.json');
  const newActivity = {
    id: `activity-${Date.now()}`,
    userId,
    type,
    title,
    message,
    timestamp: new Date().toISOString()
  };
  activities.push(newActivity);
  writeJSON('activity.json', activities);
  res.json(newActivity);
});

module.exports = router;