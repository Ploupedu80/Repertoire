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

// Get all approved servers
router.get('/', (req, res) => {
  const servers = readJSON('servers.json');
  const approved = servers.filter(s => s.status === 'approved');
  res.json(approved);
});

// Get public statistics
router.get('/stats', (req, res) => {
  const servers = readJSON('servers.json');
  const users = readJSON('users.json');

  const activeServers = servers.filter(s => s.status === 'approved' && !s.suspended);
  const totalMembers = activeServers.reduce((sum, server) => sum + (server.memberCount || 0), 0);
  const totalReviews = activeServers.reduce((sum, server) => sum + (server.reviewCount || 0), 0);

  const stats = {
    totalServers: activeServers.length,
    totalUsers: users.length,
    totalMembers: totalMembers,
    totalReviews: totalReviews
  };

  res.json(stats);
});

// Get server by id
router.get('/:id', (req, res) => {
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);
  if (server) {
    res.json(server);
  } else {
    res.status(404).json({ message: 'Server not found' });
  }
});

// Submit new server (pending)
router.post('/', requireLogin, (req, res) => {
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.user.id);
  if (user.blacklisted) {
    return res.status(403).json({ message: 'Vous êtes blacklisté et ne pouvez pas soumettre de serveur' });
  }
  const { name, inviteLink, icon, banner, description, memberCount, activityLevel, serverType, tags } = req.body;
  const servers = readJSON('servers.json');
  const newServer = {
    id: uuidv4(),
    submittedBy: req.user.id,
    name,
    inviteLink,
    icon,
    banner,
    description,
    memberCount: parseInt(memberCount),
    activityLevel,
    serverType,
    tags: tags.split(',').map(t => t.trim()),
    status: 'pending',
    suspended: false
  };
  servers.push(newServer);
  writeJSON('servers.json', servers);

  // Create activity and notification for server submission
  const activities = readJSON('activity.json');
  const notifications = readJSON('notifications.json');

  // Activity
  activities.push({
    id: `activity-${Date.now()}`,
    userId: req.user.id,
    type: 'server_submit',
    title: 'Soumission de serveur',
    message: `Vous avez soumis le serveur "${name}"`,
    timestamp: new Date().toISOString()
  });

  // Notification
  notifications.push({
    id: `notif-${Date.now()}`,
    userId: req.user.id,
    type: 'server_submit',
    title: 'Serveur soumis',
    message: `Votre serveur "${name}" a été soumis et est en attente d'approbation`,
    timestamp: new Date().toISOString(),
    read: false
  });

  writeJSON('activity.json', activities);
  writeJSON('notifications.json', notifications);

  res.json(newServer);
});

// Update server (admin/moderator)
router.put('/admin/:id', requireModeratorOrHigher, (req, res) => {
  const servers = readJSON('servers.json');
  const index = servers.findIndex(s => s.id === req.params.id);
  if (index !== -1) {
    Object.assign(servers[index], req.body);
    writeJSON('servers.json', servers);
    res.json(servers[index]);
  } else {
    res.status(404).json({ message: 'Server not found' });
  }
});

// Delete server (admin)
router.delete('/:id', requireModeratorOrHigher, (req, res) => {
  const servers = readJSON('servers.json');
  const filtered = servers.filter(s => s.id !== req.params.id);
  if (filtered.length < servers.length) {
    writeJSON('servers.json', filtered);
    res.json({ message: 'Server deleted' });
  } else {
    res.status(404).json({ message: 'Server not found' });
  }
});

// Suspend server (admin)
router.post('/:id/suspend', requireModeratorOrHigher, (req, res) => {
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);
  if (server) {
    server.suspended = true;
    writeJSON('servers.json', servers);
    res.json(server);
  } else {
    res.status(404).json({ message: 'Server not found' });
  }
});

// Unsuspend server (admin)
router.post('/:id/unsuspend', requireModeratorOrHigher, (req, res) => {
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);
  if (server) {
    server.suspended = false;
    writeJSON('servers.json', servers);
    res.json(server);
  } else {
    res.status(404).json({ message: 'Server not found' });
  }
});

// Get pending servers (admin/moderator)
router.get('/admin/pending', requireModeratorOrHigher, (req, res) => {
  const servers = readJSON('servers.json');
  const pending = servers.filter(s => s.status === 'pending');
  res.json(pending);
});

// Approve server (admin/moderator)
router.post('/:id/approve', requireModeratorOrHigher, (req, res) => {
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);
  if (server) {
    server.status = 'approved';
    writeJSON('servers.json', servers);

    // Create notification for the submitter
    const notifications = readJSON('notifications.json');
    notifications.push({
      id: `notif-${Date.now()}`,
      userId: server.submittedBy,
      type: 'server_approved',
      title: 'Serveur approuvé',
      message: `Votre serveur "${server.name}" a été approuvé et est maintenant visible`,
      timestamp: new Date().toISOString(),
      read: false
    });
    writeJSON('notifications.json', notifications);

    res.json(server);
  } else {
    res.status(404).json({ message: 'Server not found' });
  }
});

// Reject server (admin/moderator)
router.post('/:id/reject', requireModeratorOrHigher, (req, res) => {
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);
  if (server) {
    server.status = 'rejected';
    writeJSON('servers.json', servers);
    res.json(server);
  } else {
    res.status(404).json({ message: 'Server not found' });
  }
});

// Update server (owner only)
router.put('/:id', requireLogin, (req, res) => {
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);

  if (!server) {
    return res.status(404).json({ message: 'Server not found' });
  }

  // Check if user owns the server
  if (server.submittedBy !== req.user.id) {
    return res.status(403).json({ message: 'Vous n\'avez pas l\'autorisation de modifier ce serveur' });
  }

  // Update server data
  const { name, inviteLink, banner, icon, description, memberCount, serverType, activityLevel, tags } = req.body;

  if (name) server.name = name;
  if (inviteLink) server.inviteLink = inviteLink;
  if (banner !== undefined) server.banner = banner;
  if (icon !== undefined) server.icon = icon;
  if (description) server.description = description;
  if (memberCount) server.memberCount = memberCount;
  if (serverType) server.serverType = serverType;
  if (activityLevel) server.activityLevel = activityLevel;
  if (tags) server.tags = tags;

  writeJSON('servers.json', servers);
  res.json(server);
});

// Delete server (owner only)
router.delete('/:id', requireLogin, (req, res) => {
  const servers = readJSON('servers.json');
  const serverIndex = servers.findIndex(s => s.id === req.params.id);

  if (serverIndex === -1) {
    return res.status(404).json({ message: 'Server not found' });
  }

  const server = servers[serverIndex];

  // Check if user owns the server
  if (server.submittedBy !== req.user.id) {
    return res.status(403).json({ message: 'Vous n\'avez pas l\'autorisation de supprimer ce serveur' });
  }

  // Remove server
  servers.splice(serverIndex, 1);
  writeJSON('servers.json', servers);

  res.json({ message: 'Server deleted successfully' });
});

module.exports = router;