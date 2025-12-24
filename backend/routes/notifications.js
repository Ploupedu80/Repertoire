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

// Get user's notifications
router.get('/', requireLogin, (req, res) => {
  const notifications = readJSON('notifications.json');
  const userNotifications = notifications.filter(n => n.userId === req.user.id);
  res.json(userNotifications);
});

// Mark notification as read
router.post('/:id/read', requireLogin, (req, res) => {
  const notifications = readJSON('notifications.json');
  const notification = notifications.find(n => n.id === req.params.id && n.userId === req.user.id);
  if (notification) {
    notification.read = true;
    writeJSON('notifications.json', notifications);
    res.json(notification);
  } else {
    res.status(404).json({ message: 'Notification not found' });
  }
});

// Create notification (internal use)
router.post('/', (req, res) => {
  const { userId, type, title, message } = req.body;
  const notifications = readJSON('notifications.json');
  const newNotification = {
    id: `notif-${Date.now()}`,
    userId,
    type,
    title,
    message,
    timestamp: new Date().toISOString(),
    read: false
  };
  notifications.push(newNotification);
  writeJSON('notifications.json', notifications);
  res.json(newNotification);
});

module.exports = router;