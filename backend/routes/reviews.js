const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Middleware pour vérifier l'authentification
function requireLogin(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: 'Non connecté' });
  }
}

// Créer un nouvel avis
router.post('/', requireLogin, (req, res) => {
  try {
    const { serverId, rating, comment } = req.body;

    if (!serverId || !rating || !comment) {
      return res.status(400).json({ message: 'Les champs requis sont manquants' });
    }

    // Vérifier que le serveur existe
    const servers = readJSON('servers.json');
    const server = servers.find(s => s.id === serverId);
    if (!server) {
      return res.status(404).json({ message: 'Serveur non trouvé' });
    }

    // Créer l'avis
    const reviews = readJSON('reviews.json');
    const newReview = {
      id: uuidv4(),
      serverId,
      userId: req.user.id,
      username: req.user.username,
      rating: parseInt(rating),
      comment,
      createdAt: new Date().toISOString()
    };

    reviews.push(newReview);
    writeJSON('reviews.json', reviews);

    res.status(201).json(newReview);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'avis' });
  }
});

// Obtenir tous les avis (pour admin/modération)
router.get('/', (req, res) => {
  try {
    const reviews = readJSON('reviews.json');
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des avis' });
  }
});

// Obtenir les avis pour un serveur
router.get('/server/:serverId', (req, res) => {
  try {
    const reviews = readJSON('reviews.json');
    const serverReviews = reviews.filter(r => r.serverId === req.params.serverId);
    res.json(serverReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des avis' });
  }
});

// Supprimer un avis
router.delete('/:reviewId', requireLogin, (req, res) => {
  try {
    const reviews = readJSON('reviews.json');
    const review = reviews.find(r => r.id === req.params.reviewId);

    if (!review) {
      return res.status(404).json({ message: 'Avis non trouvé' });
    }

    // Vérifier que l'utilisateur est propriétaire de l'avis
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const filtered = reviews.filter(r => r.id !== req.params.reviewId);
    writeJSON('reviews.json', filtered);

    res.json({ message: 'Avis supprimé' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'avis' });
  }
});

module.exports = router;