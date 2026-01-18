const express = require('express');
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Get user's favorites
router.get('/', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  const favorites = readJSON('favorites.json');
  const userFavorites = favorites.filter(f => f.userId === req.user.id);
  res.json(userFavorites);
});

// Add to favorites
router.post('/', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  const { serverId } = req.body;

  if (!serverId) {
    return res.status(400).json({ message: 'ID de serveur requis' });
  }

  const favorites = readJSON('favorites.json');
  const existing = favorites.find(f => f.userId === req.user.id && f.serverId === serverId);

  if (existing) {
    return res.status(400).json({ message: 'Déjà dans les favoris' });
  }

  const newFavorite = {
    id: Date.now().toString(),
    userId: req.user.id,
    serverId,
    addedAt: new Date().toISOString()
  };

  favorites.push(newFavorite);
  writeJSON('favorites.json', favorites);
  res.json(newFavorite);
});

// Remove from favorites
router.delete('/:serverId', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  const favorites = readJSON('favorites.json');
  const favoriteIndex = favorites.findIndex(f => f.userId === req.user.id && f.serverId === req.params.serverId);

  if (favoriteIndex === -1) {
    return res.status(404).json({ message: 'Favori non trouvé' });
  }

  favorites.splice(favoriteIndex, 1);
  writeJSON('favorites.json', favorites);
  res.json({ message: 'Retiré des favoris' });
});

// Check if server is favorited
router.get('/check/:serverId', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  const favorites = readJSON('favorites.json');
  const isFavorited = favorites.some(f => f.userId === req.user.id && f.serverId === req.params.serverId);
  res.json({ favorited: isFavorited });
});

module.exports = router;