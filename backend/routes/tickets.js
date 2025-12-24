const express = require('express');
const { v4: uuidv4 } = require('uuid');
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

// Middleware to check role
function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: 'Insufficient permissions' });
    }
  };
}

// Middleware to check moderator or higher role
function requireModeratorOrHigher(req, res, next) {
  if (req.user && ['moderator', 'admin', 'developer'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Insufficient permissions' });
  }
}

// Get user's tickets
router.get('/', requireLogin, (req, res) => {
  const tickets = readJSON('tickets.json');
  const userTickets = tickets.filter(t => t.userId === req.user.id);
  res.json(userTickets);
});

// Create ticket
router.post('/', requireLogin, (req, res) => {
  const { subject, message } = req.body;
  const tickets = readJSON('tickets.json');
  const newTicket = {
    id: uuidv4(),
    userId: req.user.id,
    subject,
    message,
    response: '',
    status: 'open'
  };
  tickets.push(newTicket);
  writeJSON('tickets.json', tickets);

  // Create activity and notification for ticket creation
  const activities = readJSON('activity.json');
  const notifications = readJSON('notifications.json');

  // Activity
  activities.push({
    id: `activity-${Date.now()}`,
    userId: req.user.id,
    type: 'ticket_open',
    title: 'Ticket de support',
    message: `Vous avez ouvert un ticket: "${subject}"`,
    timestamp: new Date().toISOString()
  });

  // Notification
  notifications.push({
    id: `notif-${Date.now()}`,
    userId: req.user.id,
    type: 'ticket_open',
    title: 'Ticket ouvert',
    message: `Votre ticket "${subject}" a été ouvert`,
    timestamp: new Date().toISOString(),
    read: false
  });

  writeJSON('activity.json', activities);
  writeJSON('notifications.json', notifications);

  res.json(newTicket);
});

// Get all tickets (admin)
router.get('/admin/all', requireModeratorOrHigher, (req, res) => {
  const tickets = readJSON('tickets.json');
  res.json(tickets);
});

// Reply to ticket (admin)
router.post('/:id/reply', requireModeratorOrHigher, (req, res) => {
  const { response } = req.body;
  const tickets = readJSON('tickets.json');
  const ticket = tickets.find(t => t.id === req.params.id);
  if (ticket) {
    ticket.response = response;
    ticket.status = 'closed';
    writeJSON('tickets.json', tickets);
    res.json(ticket);
  } else {
    res.status(404).json({ message: 'Ticket not found' });
  }
});

module.exports = router;