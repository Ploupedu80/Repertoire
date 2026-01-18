const express = require('express');
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Get all categories
router.get('/', (req, res) => {
  const categories = readJSON('categories.json');
  res.json(categories);
});

// Get category by ID
router.get('/:id', (req, res) => {
  const categories = readJSON('categories.json');
  const category = categories.find(c => c.id === req.params.id);
  if (category) {
    res.json(category);
  } else {
    res.status(404).json({ message: 'Category not found' });
  }
});

// Create category (admin+)
router.post('/', (req, res) => {
  if (!req.user || !['admin', 'developer'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const { name, description, icon } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Name and description required' });
  }

  const categories = readJSON('categories.json');
  const newCategory = {
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    description,
    icon: icon || '🎮'
  };

  categories.push(newCategory);
  writeJSON('categories.json', categories);
  res.json(newCategory);
});

// Update category (admin+)
router.put('/:id', (req, res) => {
  if (!req.user || !['admin', 'developer'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const categories = readJSON('categories.json');
  const category = categories.find(c => c.id === req.params.id);

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const { name, description, icon } = req.body;
  if (name) category.name = name;
  if (description) category.description = description;
  if (icon) category.icon = icon;

  writeJSON('categories.json', categories);
  res.json(category);
});

// Delete category (developer only)
router.delete('/:id', (req, res) => {
  if (!req.user || req.user.role !== 'developer') {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }

  const categories = readJSON('categories.json');
  const categoryIndex = categories.findIndex(c => c.id === req.params.id);

  if (categoryIndex === -1) {
    return res.status(404).json({ message: 'Category not found' });
  }

  categories.splice(categoryIndex, 1);
  writeJSON('categories.json', categories);
  res.json({ message: 'Category deleted' });
});

module.exports = router;