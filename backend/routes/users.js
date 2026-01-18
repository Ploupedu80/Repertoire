const express = require('express');
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

// Middleware to check admin or developer role
function requireAdminOrDeveloper(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'developer')) {
    next();
  } else {
    res.status(403).json({ message: 'Permissions insuffisantes' });
  }
}

// Middleware to check moderator or higher role
function requireModeratorOrHigher(req, res, next) {
  if (req.user && ['moderator', 'admin', 'developer'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({ message: 'Permissions insuffisantes' });
  }
}

// Get all users (admin or developer)
router.get('/', requireAdminOrDeveloper, (req, res) => {
  const users = readJSON('users.json');
  res.json(users);
});

// Blacklist user (admin)
router.post('/:id/blacklist', requireModeratorOrHigher, (req, res) => {
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    user.blacklisted = true;
    writeJSON('users.json', users);
    res.json(user);
  } else {
    res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
});

// Unblacklist user (admin)
router.post('/:id/unblacklist', requireModeratorOrHigher, (req, res) => {
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    user.blacklisted = false;
    writeJSON('users.json', users);
    res.json(user);
  } else {
    res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
});

// Update user role (admin or developer)
router.put('/:id/role', requireAdminOrDeveloper, (req, res) => {
  const { role } = req.body;
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.params.id);
  if (user) {
    // Check permissions: admin can only set moderator or user, developer can set any
    if (req.user.role === 'admin' && !['moderator', 'user'].includes(role)) {
      return res.status(403).json({ message: 'Les administrateurs peuvent uniquement assigner les rôles modérateur ou utilisateur' });
    }
    user.role = role;
    writeJSON('users.json', users);
    res.json(user);
  } else {
    res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
});

// Update user profile (own profile)
router.put('/profile', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  const { username, email, currentPassword, newPassword } = req.body;
  const users = readJSON('users.json');
  const user = users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }

  // Verify current password if changing password or username
  if ((newPassword || username !== user.username) && require('crypto').createHash('sha256').update(currentPassword || '').digest('hex') !== user.password) {
    return res.status(400).json({ message: 'Mot de passe actuel incorrect' });
  }

  // Update username if changed
  if (username && username !== user.username) {
    // Check if username is already taken
    const existingUser = users.find(u => u.username === username && u.id !== user.id);
    if (existingUser) {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà pris' });
    }
    user.username = username;
  }

  // Update email
  if (email !== undefined) {
    user.email = email;
  }

  // Update password if provided
  if (newPassword) {
    user.password = require('crypto').createHash('sha256').update(newPassword).digest('hex');
  }

  writeJSON('users.json', users);

  // Update session
  req.session.user = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role
  });
});

// Get user's sanctions
router.get('/sanctions', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non connecté' });
  }
  
  let sanctions = readJSON('sanctions.json');
  const userSanctions = sanctions.filter(s => s.targetUserId === req.user.id);
  
  // Update expired sanctions
  const now = new Date();
  let updated = false;
  userSanctions.forEach(sanction => {
    if (sanction.active && sanction.expiresAt && new Date(sanction.expiresAt) <= now) {
      sanction.active = false;
      updated = true;
    }
  });
  
  if (updated) {
    // Update the sanctions file
    sanctions = sanctions.map(s => {
      const userSanction = userSanctions.find(us => us.id === s.id);
      return userSanction || s;
    });
    writeJSON('sanctions.json', sanctions);
  }
  
  res.json(userSanctions);
});

module.exports = router;