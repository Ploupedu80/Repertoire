const express = require('express');
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Function to update server rating stats
function updateServerRating(serverId) {
  try {
    const ratings = readJSON('ratings.json');
    const serverRatings = ratings.filter(r => r.serverId === serverId);
    
    const totalRatings = serverRatings.length;
    const averageRating = totalRatings > 0 ? serverRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings : 0;

    const servers = readJSON('servers.json');
    const server = servers.find(s => s.id === serverId);
    
    if (server) {
      server.averageRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal
      server.totalRatings = totalRatings;
      writeJSON('servers.json', servers);
      console.log(`Updated server ${serverId} rating: ${averageRating} (${totalRatings} ratings)`);
    }
  } catch (error) {
    console.error('Error in updateServerRating:', error);
    throw error;
  }
}

// Get all ratings
router.get('/', (req, res) => {
  const ratings = readJSON('ratings.json');
  res.json(ratings);
});

// Get ratings for a server
router.get('/server/:serverId', (req, res) => {
  const ratings = readJSON('ratings.json');
  const serverRatings = ratings.filter(r => r.serverId === req.params.serverId);
  res.json(serverRatings);
});

// Get user's rating for a server
router.get('/user/:userId/server/:serverId', (req, res) => {
  const ratings = readJSON('ratings.json');
  const rating = ratings.find(r => r.userId === req.params.userId && r.serverId === req.params.serverId);
  res.json(rating || null);
});

// Submit or update rating
router.post('/', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  const { serverId, rating } = req.body;

  if (!serverId || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Données invalides' });
  }

  const ratings = readJSON('ratings.json');
  const existingRating = ratings.find(r => r.userId === req.user.id && r.serverId === serverId);

  if (existingRating) {
    existingRating.rating = rating;
    existingRating.updatedAt = new Date().toISOString();
  } else {
    ratings.push({
      id: Date.now().toString(),
      userId: req.user.id,
      serverId,
      rating,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  writeJSON('ratings.json', ratings);

  // Update server average rating
  try {
    updateServerRating(serverId);
  } catch (error) {
    console.error('Error updating server rating:', error);
  }

  res.json({ message: 'Note enregistrée' });
});

// Delete rating
router.delete('/:ratingId', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Non authentifié' });
  }

  const ratings = readJSON('ratings.json');
  const ratingIndex = ratings.findIndex(r => r.id === req.params.ratingId && r.userId === req.user.id);

  if (ratingIndex === -1) {
    return res.status(404).json({ message: 'Note non trouvée' });
  }

  ratings.splice(ratingIndex, 1);
  writeJSON('ratings.json', ratings);
  res.json({ message: 'Note supprimée' });
});

module.exports = router;