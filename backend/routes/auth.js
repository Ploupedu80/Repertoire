const express = require('express');
const passport = require('passport');
const DiscordStrategy = require('passport-discord-auth').Strategy;
const { readJSON, writeJSON } = require('../utils/jsonUtils');

const router = express.Router();

// Configure Discord Strategy
passport.use(new DiscordStrategy({
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/api/auth/discord/callback',
  scope: ['identify', 'email']
}, (accessToken, refreshToken, profile, done) => {
  // Find or create user
  const users = readJSON('users.json');
  let user = users.find(u => u.discordId === profile.id);
  let isNewLogin = false;

  if (!user) {
    // Create new user
    user = {
      id: profile.id,
      discordId: profile.id,
      username: profile.username,
      globalName: profile.global_name,
      email: profile.email,
      avatar: profile.avatar,
      discriminator: profile.discriminator,
      banner: profile.banner,
      role: 'user',
      blacklisted: false,
      lastLogin: new Date().toISOString()
    };
    users.push(user);
    writeJSON('users.json', users);
    isNewLogin = true;
  } else {
    // Update last login
    user.lastLogin = new Date().toISOString();
    writeJSON('users.json', users);
    isNewLogin = true; // Even existing users logging in
  }

  // Create login activity and notification
  if (isNewLogin) {
    const activities = readJSON('activity.json');
    const notifications = readJSON('notifications.json');

    // Activity
    activities.push({
      id: `activity-${Date.now()}`,
      userId: user.id,
      type: 'login',
      title: 'Connexion',
      message: 'Connexion réussie depuis le navigateur',
      timestamp: new Date().toISOString()
    });

    // Notification
    notifications.push({
      id: `notif-${Date.now()}`,
      userId: user.id,
      type: 'login',
      title: 'Connexion réussie',
      message: 'Connexion réussie depuis le navigateur',
      timestamp: new Date().toISOString(),
      read: false
    });

    writeJSON('activity.json', activities);
    writeJSON('notifications.json', notifications);
  }

  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  const users = readJSON('users.json');
  const user = users.find(u => u.id === id);
  done(null, user);
});

// Discord auth routes
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', passport.authenticate('discord', { failureRedirect: '/login.html' }), (req, res) => {
  res.redirect('/profile.html');
});

// Logout
router.post('/logout', (req, res) => {
  req.logout(() => {
    req.session.destroy();
    res.json({ success: true });
  });
});

// Get current user
router.get('/me', (req, res) => {
  if (req.user) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: 'Not logged in' });
  }
});

// Update user settings
router.put('/me', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not logged in' });
  }

  const users = readJSON('users.json');
  const userIndex = users.findIndex(u => u.id === req.user.id);

  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Update allowed fields
  const { globalName, email, emailNotifications } = req.body;
  if (globalName !== undefined) users[userIndex].globalName = globalName;
  if (email !== undefined) users[userIndex].email = email;
  if (emailNotifications !== undefined) users[userIndex].emailNotifications = emailNotifications;

  writeJSON('users.json', users);

  // Create activity for profile update
  const activities = readJSON('activity.json');
  activities.push({
    id: `activity-${Date.now()}`,
    userId: req.user.id,
    type: 'profile_update',
    title: 'Mise à jour du profil',
    message: 'Vous avez mis à jour vos paramètres de profil',
    timestamp: new Date().toISOString()
  });
  writeJSON('activity.json', activities);

  res.json(users[userIndex]);
});

module.exports = router;