const express = require('express');
const { readJSON, writeJSON } = require('../utils/jsonUtils');
const { createNotification } = require('../utils/notificationUtils');

const router = express.Router();

// Middleware pour vérifier le rôle
function requireRole(...roles) {
  return (req, res, next) => {
    // Vérifier si l'utilisateur est authentifié via Passport
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié - Veuillez vous connecter' });
    }

    // Vérifier le rôle
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Interdit - Permissions insuffisantes' });
    }

    next();
  };
}

// === ENDPOINTS DÉVELOPPEUR ===

// Obtenir le rôle de l'utilisateur
router.get('/user-role/:userId', (req, res) => {
  const { userId } = req.params;
  const users = readJSON('users.json');
  const user = users.find(u => u.id === userId || u.discordId === userId);

  if (!user) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  res.json({
    role: user.role,
    username: user.username,
    globalName: user.globalName,
    discordId: user.discordId
  });
});

// === GESTION DES ANNONCES (Développeur) ===

// Créer/modifier une annonce
router.post('/announcements', requireRole('developer'), (req, res) => {
  const { title, content, priority = 'normal' } = req.body;
  const announcements = readJSON('announcements.json');

  const newAnnouncement = {
    id: Date.now().toString(),
    title,
    content,
    priority,
    createdBy: req.user.username || req.user.globalName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  announcements.push(newAnnouncement);
  writeJSON('announcements.json', announcements);

  res.status(201).json(newAnnouncement);
});

// Supprimer une annonce
router.delete('/announcements/:announcementId', requireRole('developer'), (req, res) => {
  const { announcementId } = req.params;
  let announcements = readJSON('announcements.json');

  announcements = announcements.filter(a => a.id !== announcementId);
  writeJSON('announcements.json', announcements);

  res.json({ message: 'Annonce supprimée' });
});

// === GESTION DE LA BLACKLIST (Développeur) ===

// Ajouter un utilisateur à la blacklist
router.post('/blacklist', requireRole('developer'), (req, res) => {
  const { discordId, reason } = req.body;
  let users = readJSON('users.json');

  const userIndex = users.findIndex(u => u.id === discordId || u.discordId === discordId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  users[userIndex].blacklisted = true;
  users[userIndex].blacklistReason = reason;
  users[userIndex].blacklistedAt = new Date().toISOString();
  users[userIndex].blacklistedBy = req.user.username || req.user.globalName;

  writeJSON('users.json', users);
  res.json({ message: 'Utilisateur blacklisté', user: users[userIndex] });
});

// Retirer de la blacklist
router.post('/unblacklist', requireRole('developer'), (req, res) => {
  const { discordId } = req.body;
  let users = readJSON('users.json');

  const userIndex = users.findIndex(u => u.id === discordId || u.discordId === discordId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'Utilisateur non trouvé' });
  }

  users[userIndex].blacklisted = false;
  delete users[userIndex].blacklistReason;
  delete users[userIndex].blacklistedAt;
  delete users[userIndex].blacklistedBy;

  writeJSON('users.json', users);
  res.json({ message: 'Utilisateur retiré de la blacklist', user: users[userIndex] });
});

// Obtenir la liste des utilisateurs blacklistés
router.get('/blacklist', requireRole('developer'), (req, res) => {
  const users = readJSON('users.json');
  const blacklisted = users.filter(u => u.blacklisted === true);
  res.json(blacklisted);
});

// === GESTION DES SERVEURS (Développeur) ===

// Suspendre un serveur
router.post('/suspend-server', requireRole('developer'), (req, res) => {
  const { serverId, reason } = req.body;
  let servers = readJSON('servers.json');

  const serverIndex = servers.findIndex(s => s.id === serverId);
  if (serverIndex === -1) {
    return res.status(404).json({ error: 'Serveur non trouvé' });
  }

  servers[serverIndex].suspended = true;
  servers[serverIndex].suspensionReason = reason;
  servers[serverIndex].suspendedAt = new Date().toISOString();
  servers[serverIndex].suspendedBy = req.user.username || req.user.globalName;

  writeJSON('servers.json', servers);
  
  // Create notification for server owner
  const server = servers[serverIndex];
  if (server.submittedBy) {
    createNotification(
      server.submittedBy,
      'server_suspended',
      '⛔ Serveur suspendu',
      `Votre serveur "${server.name}" a été suspendu.\nRaison: ${reason || 'Non spécifiée'}`
    );
  }
  
  res.json({ message: 'Serveur suspendu', server: servers[serverIndex] });
});

// Rétablir un serveur
router.post('/unsuspend-server', requireRole('developer'), (req, res) => {
  const { serverId } = req.body;
  let servers = readJSON('servers.json');

  const serverIndex = servers.findIndex(s => s.id === serverId);
  if (serverIndex === -1) {
    return res.status(404).json({ error: 'Serveur non trouvé' });
  }

  servers[serverIndex].suspended = false;
  delete servers[serverIndex].suspensionReason;
  delete servers[serverIndex].suspendedAt;
  delete servers[serverIndex].suspendedBy;

  writeJSON('servers.json', servers);
  res.json({ message: 'Serveur rétabli', server: servers[serverIndex] });
});

// Rechercher les serveurs
router.get('/servers-search', requireRole('developer'), (req, res) => {
  const { query, suspended } = req.query;
  let servers = readJSON('servers.json');

  if (query) {
    servers = servers.filter(s =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.id.includes(query)
    );
  }

  if (suspended === 'true') {
    servers = servers.filter(s => s.suspended === true);
  } else if (suspended === 'false') {
    servers = servers.filter(s => s.suspended !== true);
  }

  res.json(servers);
});

// === GESTION DES SANCTIONS (Développeur & Admin) ===

// Ajouter une sanction
router.post('/sanctions', requireRole('developer', 'admin'), (req, res) => {
  const { targetUserId, type, duration, reason } = req.body;
  // type: 'avertissement_oral', 'avertissement_1', 'avertissement_2', 'ban_temp', 'ban_perm', 'blacklist'
  
  let sanctions = readJSON('sanctions.json');

  const newSanction = {
    id: Date.now().toString(),
    targetUserId,
    type,
    duration,
    reason,
    appliedBy: req.user.username || req.user.globalName,
    appliedAt: new Date().toISOString(),
    expiresAt: duration ? new Date(Date.now() + duration * 1000).toISOString() : null,
    active: true
  };

  sanctions.push(newSanction);
  writeJSON('sanctions.json', sanctions);

  // Si c'est une blacklist, mettre à jour l'utilisateur
  if (type === 'blacklist') {
    let users = readJSON('users.json');
    const userIndex = users.findIndex(u => u.id === targetUserId || u.discordId === targetUserId);
    if (userIndex !== -1) {
      users[userIndex].blacklisted = true;
      users[userIndex].blacklistReason = reason;
      users[userIndex].blacklistedAt = new Date().toISOString();
      users[userIndex].blacklistedBy = req.user.username || req.user.globalName;
      writeJSON('users.json', users);
    }
  }

  res.status(201).json(newSanction);
});

// Obtenir les sanctions d'un utilisateur
router.get('/sanctions/:userId', requireRole('developer', 'admin', 'moderator'), (req, res) => {
  const { userId } = req.params;
  const sanctions = readJSON('sanctions.json');
  const userSanctions = sanctions.filter(s => s.targetUserId === userId);
  res.json(userSanctions);
});

// Obtenir toutes les sanctions
router.get('/sanctions', requireRole('developer', 'admin', 'moderator'), (req, res) => {
  const sanctions = readJSON('sanctions.json');
  res.json(sanctions);
});

// Supprimer une sanction
router.delete('/sanctions/:sanctionId', requireRole('developer', 'admin'), (req, res) => {
  const { sanctionId } = req.params;
  let sanctions = readJSON('sanctions.json');
  const sanctionIndex = sanctions.findIndex(s => s.id === sanctionId);
  
  if (sanctionIndex === -1) {
    return res.status(404).json({ error: 'Sanction non trouvée' });
  }
  
  const deletedSanction = sanctions[sanctionIndex];
  sanctions.splice(sanctionIndex, 1);
  writeJSON('sanctions.json', sanctions);
  
  res.json({ message: 'Sanction supprimée', sanction: deletedSanction });
});

// === GESTION DES TICKETS (Admin & Modérateur) ===

// Créer un endpoint pour obtenir les tickets
router.get('/tickets', requireRole('admin', 'moderator'), (req, res) => {
  const tickets = readJSON('tickets.json');
  res.json(tickets);
});

// Mettre à jour le statut d'un ticket
router.put('/tickets/:ticketId', requireRole('admin', 'moderator'), (req, res) => {
  const { ticketId } = req.params;
  const { status, response } = req.body;
  
  let tickets = readJSON('tickets.json');
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);

  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket non trouvé' });
  }

  tickets[ticketIndex].status = status;
  if (response) {
    tickets[ticketIndex].response = response;
    tickets[ticketIndex].respondedBy = req.user.username || req.user.globalName;
    tickets[ticketIndex].respondedAt = new Date().toISOString();
  }

  writeJSON('tickets.json', tickets);
  res.json(tickets[ticketIndex]);
});

// === GESTION DES APPELS (Appeals) ===

// Créer un appel contre une suspension
router.post('/appeals', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized - Please login' });
  }

  const { serverId, explanation } = req.body;

  if (!serverId || !explanation) {
    return res.status(400).json({ error: 'ID du serveur ou explication manquante' });
  }

  // Vérifier que le serveur existe et est suspendu
  const servers = readJSON('servers.json');
  const server = servers.find(s => s.id === serverId);

  if (!server) {
    return res.status(404).json({ error: 'Serveur non trouvé' });
  }

  if (!server.suspended) {
    return res.status(400).json({ error: 'Le serveur n\'est pas suspendu' });
  }

  // Vérifier que l'utilisateur est le propriétaire du serveur
  if (server.submittedBy !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'developer') {
    return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à contester ce serveur' });
  }

  // Créer l'appel
  const appeals = readJSON('appeals.json');
  const appeal = {
    id: Date.now().toString(),
    serverId: serverId,
    serverName: server.name,
    submittedBy: req.user.id,
    submittedByName: req.user.username || req.user.globalName,
    explanation: explanation,
    status: 'pending', // pending, accepted, refused
    submittedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null,
    decision: null
  };

  appeals.push(appeal);
  writeJSON('appeals.json', appeals);

  // Créer une notification pour les admins/développeurs
  createNotification(
    'appeal_submitted',
    `Un appel a été soumis pour le serveur "${server.name}"`,
    { appealId: appeal.id, serverId: serverId }
  );

  res.status(201).json(appeal);
});

// Récupérer les appels d'un utilisateur - MUST BE BEFORE /appeals/:appealId
router.get('/appeals/user/:userId', (req, res) => {
  const { userId } = req.params;

  if (!req.user || (req.user.id !== userId && req.user.role !== 'admin' && req.user.role !== 'developer')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const appeals = readJSON('appeals.json');
  const userAppeals = appeals.filter(a => a.submittedBy === userId);
  res.json(userAppeals);
});

// Vérifier si un serveur a un appel en attente - MUST BE BEFORE /appeals/:appealId
router.get('/appeals/server/:serverId', (req, res) => {
  const { serverId } = req.params;

  const appeals = readJSON('appeals.json');
  const appeal = appeals.find(a => a.serverId === serverId && a.status === 'pending');
  
  res.json(appeal || null);
});

// Récupérer tous les appels (admin/developer seulement)
router.get('/appeals', requireRole('admin', 'developer', 'moderator'), (req, res) => {
  const appeals = readJSON('appeals.json');
  res.json(appeals);
});

// Accepter ou refuser un appel (admin/developer seulement)
router.put('/appeals/:appealId', requireRole('admin', 'developer'), (req, res) => {
  const { appealId } = req.params;
  const { decision, decisionReason } = req.body; // decision: 'accepted' or 'refused'

  if (!['accepted', 'refused'].includes(decision)) {
    return res.status(400).json({ error: 'Décision invalide. Doit être "acceptée" ou "refusée"' });
  }

  const appeals = readJSON('appeals.json');
  const appealIndex = appeals.findIndex(a => a.id === appealId);

  if (appealIndex === -1) {
    return res.status(404).json({ error: 'Appel non trouvé' });
  }

  const appeal = appeals[appealIndex];

  // Mettre à jour l'appel
  appeal.status = decision;
  appeal.reviewedBy = req.user.id;
  appeal.reviewedByName = req.user.username || req.user.globalName;
  appeal.reviewedAt = new Date().toISOString();
  appeal.decision = decisionReason || '';

  // Si accepté, désuspendre le serveur
  if (decision === 'accepted') {
    const servers = readJSON('servers.json');
    const serverIndex = servers.findIndex(s => s.id === appeal.serverId);

    if (serverIndex !== -1) {
      servers[serverIndex].suspended = false;
      delete servers[serverIndex].suspendedAt;
      delete servers[serverIndex].suspendedBy;
      writeJSON('servers.json', servers);

      // Créer une notification pour le propriétaire du serveur
      createNotification(
        'appeal_accepted',
        `Votre appel pour le serveur "${appeal.serverName}" a été accepté. Le serveur n'est plus suspendu.`,
        { appealId: appealId, serverId: appeal.serverId }
      );
    }
  } else {
    // Si refusé, créer une notification
    createNotification(
      'appeal_refused',
      `Votre appel pour le serveur "${appeal.serverName}" a été refusé.`,
      { appealId: appealId, serverId: appeal.serverId }
    );
  }

  writeJSON('appeals.json', appeals);
  res.json(appeal);
});

module.exports = router;
