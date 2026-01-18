const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const multer = require('multer');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');
const activityRoutes = require('./routes/activity');
const moderationRoutes = require('./routes/moderation');
const partnerRoutes = require('./routes/partners');
const ratingsRoutes = require('./routes/ratings');
const reviewsRoutes = require('./routes/reviews');
const categoriesRoutes = require('./routes/categories');
const favoritesRoutes = require('./routes/favorites');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'gamehub-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../asset/uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Middleware to check access to the site (development mode)
const DEV_ACCESS_CODE = 'dev2026';
const ACCESS_TOKEN_KEY = 'gamehub_access_token';

app.get('/access.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/access.html'));
});

// API endpoint to verify access code
app.post('/api/verify-access', (req, res) => {
  const { code } = req.body;
  
  if (code === DEV_ACCESS_CODE) {
    req.session[ACCESS_TOKEN_KEY] = true;
    res.json({ success: true, message: 'Accès autorisé' });
  } else {
    res.status(401).json({ success: false, message: 'Code d\'accès incorrect' });
  }
});

// Middleware to verify access for all pages except access.html and API routes
app.use((req, res, next) => {
  // Skip verification for API routes, assets, and access page
  if (req.path.startsWith('/api/') || req.path.startsWith('/asset/') || req.path === '/access.html') {
    return next();
  }

  // Check if user has valid access token in session
  if (!req.session[ACCESS_TOKEN_KEY]) {
    // Redirect to access page if no token
    return res.redirect('/access.html');
  }

  next();
});

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve asset files
app.use('/asset', express.static(path.join(__dirname, '../asset')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users', userRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/partners', partnerRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/favorites', favoritesRoutes);

// Default route - Landing page accessible only once
app.get('/', (req, res) => {
  // Check if user has already seen the landing page
  if (req.session.hasSeenLanding) {
    // Redirect to main page if already seen
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  } else {
    // Mark landing page as seen in session
    req.session.hasSeenLanding = true;
    res.sendFile(path.join(__dirname, '../frontend/landing.html'));
  }
});

// Route to manually return to landing page (optional)
app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/landing.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});