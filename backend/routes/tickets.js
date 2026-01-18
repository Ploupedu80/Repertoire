const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/jsonUtils');
const { createNotification } = require('../utils/notificationUtils');

const router = express.Router();

// Middleware to check if logged in
function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: 'Non connecté' });
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

// Get user's tickets
router.get('/', requireLogin, (req, res) => {
  try {
    const tickets = readJSON('tickets.json');
    const userId = String(req.user.id);
    const userTickets = tickets.filter(t => String(t.userId) === userId);
    res.json(userTickets);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des tickets' });
  }
});

// Create ticket
router.post('/', requireLogin, (req, res) => {
  try {
    const { subject, message, category, priority } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ message: 'Le sujet et le message sont requis' });
    }

    const tickets = readJSON('tickets.json');
    const newTicket = {
      id: uuidv4(),
      userId: req.user.id,
      username: req.user.username || req.user.globalName || 'Unknown',
      subject,
      message,
      category: category || 'general',
      priority: priority || 'normal',
      status: 'open',
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    tickets.push(newTicket);
    writeJSON('tickets.json', tickets);

    // Create notification for ticket creator
    createNotification(
      req.user.id,
      'ticket_open',
      '🎫 Ticket créé',
      `Votre ticket "${subject}" a été créé avec succès`
    );

    res.json(newTicket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: 'Erreur lors de la création du ticket' });
  }
});

// Get all tickets (admin/moderator)
router.get('/admin/all', requireModeratorOrHigher, (req, res) => {
  try {
    const tickets = readJSON('tickets.json');
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement des tickets' });
  }
});

// Get single ticket
router.get('/:id', requireLogin, (req, res) => {
  try {
    const tickets = readJSON('tickets.json');
    const ticket = tickets.find(t => t.id === req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    // Check if user owns ticket or is admin (convert to string for comparison)
    const userId = String(req.user.id);
    const ticketOwnerId = String(ticket.userId);
    const userRole = req.user.role || 'user';
    
    if (ticketOwnerId !== userId && !['admin', 'moderator', 'developer'].includes(userRole)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du chargement du ticket' });
  }
});

// Add response to ticket
router.post('/:id/response', (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non connecté' });
    }

    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Le message est requis' });
    }

    const tickets = readJSON('tickets.json');
    const ticket = tickets.find(t => t.id === req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    // Check if user owns ticket or is admin (convert to string for comparison)
    const userId = String(req.user.id);
    const ticketOwnerId = String(ticket.userId);
    const userRole = req.user.role || 'user';
    
    if (ticketOwnerId !== userId && !['admin', 'moderator', 'developer'].includes(userRole)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const response = {
      id: uuidv4(),
      userId: req.user.id,
      username: req.user.username || req.user.globalName || 'Unknown',
      message,
      isAdmin: ['admin', 'moderator', 'developer'].includes(userRole),
      createdAt: new Date().toISOString()
    };

    if (!ticket.responses) {
      ticket.responses = [];
    }

    ticket.responses.push(response);
    ticket.updatedAt = new Date().toISOString();

    writeJSON('tickets.json', tickets);
    
    // Create notification for ticket owner if it's a response from support
    if (response.isAdmin && String(req.user.id) !== String(ticket.userId)) {
      createNotification(
        ticket.userId,
        'ticket_response',
        '💬 Nouvelle réponse',
        `L'équipe de support a répondu à votre ticket: "${ticket.subject}"`
      );
    } else if (!response.isAdmin && String(req.user.id) === String(ticket.userId)) {
      // Notify admins/moderators of new response
      const users = readJSON('users.json');
      const admins = users.filter(u => ['admin', 'moderator', 'developer'].includes(u.role));
      admins.forEach(admin => {
        createNotification(
          admin.id,
          'ticket_response',
          '💬 Nouvelle réponse à un ticket',
          `${req.user.username || req.user.globalName} a répondu au ticket: "${ticket.subject}"`
        );
      });
    }
    
    res.json(ticket);
  } catch (error) {
    console.error('Error adding response:', error);
    res.status(500).json({ message: 'Erreur lors de l\'ajout de la réponse' });
  }
});

// Update ticket status (admin only)
router.patch('/:id/status', requireModeratorOrHigher, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const tickets = readJSON('tickets.json');
    const ticket = tickets.find(t => t.id === req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();

    writeJSON('tickets.json', tickets);
    
    // Create notification for ticket owner
    if (String(req.user.id) !== String(ticket.userId)) {
      const statusTexts = {
        'open': 'Ouvert',
        'in-progress': 'En cours',
        'resolved': 'Résolu',
        'closed': 'Fermé'
      };
      
      createNotification(
        ticket.userId,
        'ticket_status',
        '⚡ Statut du ticket mis à jour',
        `Votre ticket "${ticket.subject}" est maintenant ${statusTexts[status]}`
      );
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du ticket' });
  }
});

// Update ticket priority (admin only)
router.patch('/:id/priority', requireModeratorOrHigher, (req, res) => {
  try {
    const { priority } = req.body;
    const validPriorities = ['low', 'normal', 'high', 'urgent'];

    if (!validPriorities.includes(priority)) {
      return res.status(400).json({ message: 'Priorité invalide' });
    }

    const tickets = readJSON('tickets.json');
    const ticket = tickets.find(t => t.id === req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();

    writeJSON('tickets.json', tickets);
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la priorité' });
  }
});

// Delete ticket (moderator and higher only)
router.delete('/:id', requireModeratorOrHigher, (req, res) => {
  try {
    let tickets = readJSON('tickets.json');
    const ticketIndex = tickets.findIndex(t => t.id === req.params.id);

    if (ticketIndex === -1) {
      return res.status(404).json({ message: 'Ticket non trouvé' });
    }

    const deletedTicket = tickets[ticketIndex];
    tickets.splice(ticketIndex, 1);
    writeJSON('tickets.json', tickets);

    // Create notification for ticket owner
    if (String(req.user.id) !== String(deletedTicket.userId)) {
      createNotification(
        deletedTicket.userId,
        'ticket_deleted',
        '🗑️ Ticket supprimé',
        `Votre ticket "${deletedTicket.subject}" a été supprimé par un modérateur`
      );
    }

    res.json({ message: 'Ticket supprimé avec succès', ticket: deletedTicket });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du ticket' });
  }
});

module.exports = router;