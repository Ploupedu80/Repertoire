const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Middleware to check developer role
function requireDeveloper(req, res, next) {
  if (req.user && req.user.role === 'developer') {
    next();
  } else {
    res.status(403).json({ message: 'Permissions insuffisantes' });
  }
}

// Get all partners (public)
router.get('/', (req, res) => {
  try {
    const partners = readJSON('partners.json');
    res.json(partners);
  } catch (error) {
    console.error('Error loading partners:', error);
    res.status(500).json({ message: 'Erreur lors du chargement des partenaires' });
  }
});

// Create partner (developer only)
router.post('/', requireDeveloper, (req, res) => {
  try {
    const { name, description, image, externalLink } = req.body;

    if (!name || !description || !image) {
      return res.status(400).json({ message: 'Le nom, la description et l\'image sont requis' });
    }

    const partners = readJSON('partners.json');
    const newPartner = {
      id: uuidv4(),
      name,
      description,
      image,
      externalLink: externalLink || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    partners.push(newPartner);
    writeJSON('partners.json', partners);

    res.json(newPartner);
  } catch (error) {
    console.error('Error creating partner:', error);
    res.status(500).json({ message: 'Erreur lors de la création du partenaire' });
  }
});

// Update partner (developer only)
router.put('/:id', requireDeveloper, (req, res) => {
  try {
    const { name, description, image, externalLink } = req.body;
    const partners = readJSON('partners.json');
    const partnerIndex = partners.findIndex(p => p.id === req.params.id);

    if (partnerIndex === -1) {
      return res.status(404).json({ message: 'Partenaire non trouvé' });
    }

    if (name) partners[partnerIndex].name = name;
    if (description) partners[partnerIndex].description = description;
    if (image) partners[partnerIndex].image = image;
    if (externalLink !== undefined) partners[partnerIndex].externalLink = externalLink;
    partners[partnerIndex].updatedAt = new Date().toISOString();

    writeJSON('partners.json', partners);
    res.json(partners[partnerIndex]);
  } catch (error) {
    console.error('Error updating partner:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du partenaire' });
  }
});

// Delete partner (developer only)
router.delete('/:id', requireDeveloper, (req, res) => {
  try {
    let partners = readJSON('partners.json');
    const partnerIndex = partners.findIndex(p => p.id === req.params.id);

    if (partnerIndex === -1) {
      return res.status(404).json({ message: 'Partenaire non trouvé' });
    }

    const deletedPartner = partners[partnerIndex];
    partners.splice(partnerIndex, 1);
    writeJSON('partners.json', partners);

    res.json({ message: 'Partenaire supprimé avec succès', partner: deletedPartner });
  } catch (error) {
    console.error('Error deleting partner:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du partenaire' });
  }
});

module.exports = router;
