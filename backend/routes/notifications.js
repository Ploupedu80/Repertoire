const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Middleware to check if logged in
function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: 'Non connecté' });
  }
}

// Get user's notifications
router.get('/', requireLogin, (req, res) => {
  try {
    const notifications = readJSON('notifications.json');
    const userId = String(req.user.id);
    const userNotifications = notifications.filter(n => String(n.userId) === userId);
    
    // Sort by newest first
    userNotifications.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
    
    res.json(userNotifications);
  } catch (error) {
    console.error('Error loading notifications:', error);
    res.status(500).json({ message: 'Erreur lors du chargement des notifications' });
  }
});

// Get unread count (specific - must be before /:id)
router.get('/count', requireLogin, (req, res) => {
  try {
    const notifications = readJSON('notifications.json');
    const userId = String(req.user.id);
    const unreadCount = notifications.filter(n => String(n.userId) === userId && !n.read).length;
    
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'obtention du nombre de notifications non lues' });
  }
});

// Mark all notifications as read (specific - must be before /:id)
router.patch('/all/read', requireLogin, (req, res) => {
  try {
    const notifications = readJSON('notifications.json');
    const userId = String(req.user.id);

    notifications.forEach(n => {
      if (String(n.userId) === userId) {
        n.read = true;
      }
    });

    writeJSON('notifications.json', notifications);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des notifications' });
  }
});

// Delete all notifications (specific - must be before /:id)
router.delete('/all', requireLogin, (req, res) => {
  try {
    let notifications = readJSON('notifications.json');
    const userId = String(req.user.id);

    notifications = notifications.filter(n => String(n.userId) !== userId);

    writeJSON('notifications.json', notifications);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression des notifications' });
  }
});

// Mark notification as read (specific parameter route)
router.patch('/:id/read', requireLogin, (req, res) => {
  try {
    const notifications = readJSON('notifications.json');
    const notification = notifications.find(n => n.id === req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user owns this notification
    if (String(notification.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notification.read = true;
    writeJSON('notifications.json', notifications);

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// Delete notification (generic parameter route - must be last)
router.delete('/:id', requireLogin, (req, res) => {
  try {
    const notifications = readJSON('notifications.json');
    const notificationIndex = notifications.findIndex(n => n.id === req.params.id);

    if (notificationIndex === -1) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Check if user owns this notification
    if (String(notifications[notificationIndex].userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    notifications.splice(notificationIndex, 1);
    writeJSON('notifications.json', notifications);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notification' });
  }
});

module.exports = router;