const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/jsonUtils');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../asset/uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Middleware to check if logged in
function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: 'Non connecté' });
  }
}

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

// Middleware to check moderator or higher role
function requireModeratorOrHigher(req, res, next) {
  console.log('requireModeratorOrHigher - req.user:', req.user);
  if (req.user && ['moderator', 'admin', 'developer'].includes(req.user.role)) {
    next();
  } else {
    console.log('Access denied - user:', req.user ? req.user.role : 'not logged in');
    res.status(403).json({ message: 'Permissions insuffisantes' });
  }
}

// Get all approved servers
router.get('/', (req, res) => {
  const servers = readJSON('servers.json');
  let approved = servers.filter(s => s.status === 'approved' && !s.suspended);

  // Apply filters
  const { category, language, region, minMembers, maxMembers, search, sort } = req.query;

  if (category) {
    approved = approved.filter(s => s.category === category);
  }

  if (language) {
    approved = approved.filter(s => s.language === language);
  }

  if (region) {
    approved = approved.filter(s => s.region === region);
  }

  if (minMembers) {
    approved = approved.filter(s => s.memberCount >= parseInt(minMembers));
  }

  if (maxMembers) {
    approved = approved.filter(s => s.memberCount <= parseInt(maxMembers));
  }

  if (search) {
    const searchLower = search.toLowerCase();
    approved = approved.filter(s => 
      s.name.toLowerCase().includes(searchLower) ||
      s.description.toLowerCase().includes(searchLower) ||
      s.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  // Sort
  if (sort === 'rating') {
    approved.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
  } else if (sort === 'members') {
    approved.sort((a, b) => b.memberCount - a.memberCount);
  } else if (sort === 'newest') {
    approved.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

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

// Get pending servers (admin/moderator) - MUST BE BEFORE /:id
router.get('/admin/pending', requireModeratorOrHigher, (req, res) => {
  console.log('GET /admin/pending called - User:', req.user);
  const servers = readJSON('servers.json');
  const pending = servers.filter(s => s.status === 'pending');
  console.log('Pending servers found:', pending.length);
  res.json(pending);
});

// Get server by id
router.get('/:id', (req, res) => {
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);
  if (server) {
    res.json(server);
  } else {
    res.status(404).json({ message: 'Serveur non trouvé' });
  }
});

// Submit new server (pending)
router.post('/', requireLogin, upload.fields([{ name: 'icon', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), (req, res) => {
  try {
    console.log('Submit server - req.user:', req.user);
    console.log('Submit server - req.body:', req.body);
    console.log('Submit server - req.files:', req.files);
      
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Session invalide' });
      }
      
      const users = readJSON('users.json');
      const user = users.find(u => u.id === req.user.id);
      if (!user) {
        return res.status(401).json({ message: 'Utilisateur non trouvé' });
      }
      if (user.blacklisted) {
        return res.status(403).json({ message: 'Vous êtes blacklisté et ne pouvez pas soumettre de serveur' });
      }
      const { name, inviteLink, description, memberCount, activityLevel, serverType, tags, category, language, region } = req.body;
      
      // Validation des champs requis
      if (!name || !inviteLink || !description || !category) {
        return res.status(400).json({ message: 'Nom, lien d\'invitation, description et catégorie sont requis' });
      }
      
      const icon = req.files && req.files.icon ? `/asset/uploads/${req.files.icon[0].filename}` : null;
      const banner = req.files && req.files.banner ? `/asset/uploads/${req.files.banner[0].filename}` : null;
      const servers = readJSON('servers.json');
      const newServer = {
        id: uuidv4(),
        submittedBy: req.user.id,
        name,
        inviteLink,
        icon,
        banner,
        description,
        memberCount: parseInt(memberCount) || 0,
        activityLevel: activityLevel || 'Medium',
        serverType: serverType || 'Gaming',
        category: category || 'community',
        language: language || 'fr',
        region: region || 'Europe',
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        status: 'pending',
        suspended: false,
        averageRating: 0,
        totalRatings: 0,
        totalReviews: 0,
        createdAt: new Date().toISOString()
      };
      servers.push(newServer);
      writeJSON('servers.json', servers);

      res.json(newServer);
    } catch (error) {
      console.error('Error submitting server:', error);
      res.status(500).json({ message: 'Erreur lors de la soumission du serveur' });
    }
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
    res.status(404).json({ message: 'Serveur non trouvé' });
  }
});

// Delete server (admin)
router.delete('/:id', requireModeratorOrHigher, (req, res) => {
  const servers = readJSON('servers.json');
  const filtered = servers.filter(s => s.id !== req.params.id);
  if (filtered.length < servers.length) {
    writeJSON('servers.json', filtered);
    res.json({ message: 'Serveur supprimé' });
  } else {
    res.status(404).json({ message: 'Serveur non trouvé' });
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
    res.status(404).json({ message: 'Serveur non trouvé' });
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
    res.status(404).json({ message: 'Serveur non trouvé' });
  }
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
    res.status(404).json({ message: 'Serveur non trouvé' });
  }
});

// Reject server (admin/moderator)
router.post('/:id/reject', requireModeratorOrHigher, (req, res) => {
  const { reason } = req.body;
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);
  if (server) {
    server.status = 'rejected';
    server.rejectionReason = reason || 'Serveur rejeté par la modération';
    server.rejectedAt = new Date().toISOString();
    server.rejectedBy = req.user.username || req.user.globalName;
    writeJSON('servers.json', servers);

    // Create notification for the submitter
    const notifications = readJSON('notifications.json');
    notifications.push({
      id: `notif-${Date.now()}`,
      userId: server.submittedBy,
      type: 'server_rejected',
      title: 'Serveur rejeté',
      message: `Votre serveur "${server.name}" a été rejeté. Raison: ${server.rejectionReason}`,
      timestamp: new Date().toISOString(),
      read: false
    });
    writeJSON('notifications.json', notifications);

    res.json(server);
  } else {
    res.status(404).json({ message: 'Serveur non trouvé' });
  }
});

// Update server (owner only)
router.put('/:id', requireLogin, (req, res) => {
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === req.params.id);

  if (!server) {
    return res.status(404).json({ message: 'Serveur non trouvé' });
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
    return res.status(404).json({ message: 'Serveur non trouvé' });
  }

  const server = servers[serverIndex];

  // Check if user owns the server
  if (server.submittedBy !== req.user.id) {
    return res.status(403).json({ message: 'Vous n\'avez pas l\'autorisation de supprimer ce serveur' });
  }

  // Remove server
  servers.splice(serverIndex, 1);
  writeJSON('servers.json', servers);

  res.json({ message: 'Serveur supprimé avec succès' });
});

module.exports = router;