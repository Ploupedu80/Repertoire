const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const ticketRoutes = require('./routes/tickets');
const userRoutes = require('./routes/users');
const announcementRoutes = require('./routes/announcements');
const notificationRoutes = require('./routes/notifications');
const activityRoutes = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'gamehub-secret-key', // In production, use a strong secret
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

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

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/landing.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});