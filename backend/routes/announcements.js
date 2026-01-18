const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Middleware to check role
function requireRole(role) {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      res.status(403).json({ message: 'Permissions insuffisantes' });
    }
  };
}

// Get active announcements
router.get('/', (req, res) => {
  const announcements = readJSON('announcements.json');
  const active = announcements.filter(a => a.active);
  res.json(active);
});

// Get all announcements (developer)
router.get('/all', requireRole('developer'), (req, res) => {
  const announcements = readJSON('announcements.json');
  res.json(announcements);
});

// Create announcement (developer)
router.post('/', requireRole('developer'), (req, res) => {
  const { title, message } = req.body;
  const announcements = readJSON('announcements.json');
  const newAnnouncement = {
    id: uuidv4(),
    title,
    message,
    date: new Date().toISOString().split('T')[0],
    active: true
  };
  announcements.push(newAnnouncement);
  writeJSON('announcements.json', announcements);
  res.json(newAnnouncement);
});

// Update announcement (developer)
router.put('/:id', requireRole('developer'), (req, res) => {
  const announcements = readJSON('announcements.json');
  const index = announcements.findIndex(a => a.id === req.params.id);
  if (index !== -1) {
    Object.assign(announcements[index], req.body);
    writeJSON('announcements.json', announcements);
    res.json(announcements[index]);
  } else {
    res.status(404).json({ message: 'Annonce non trouvée' });
  }
});

// Delete announcement (developer)
router.delete('/:id', requireRole('developer'), (req, res) => {
  const announcements = readJSON('announcements.json');
  const filtered = announcements.filter(a => a.id !== req.params.id);
  if (filtered.length < announcements.length) {
    writeJSON('announcements.json', filtered);
    res.json({ message: 'Annonce supprimée' });
  } else {
    res.status(404).json({ message: 'Annonce non trouvée' });
  }
});

module.exports = router;