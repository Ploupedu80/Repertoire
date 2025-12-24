// profile.js - Gestion du profil utilisateur

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProfile();
  setupEventListeners();
});

function checkAuth() {
  fetch('/api/auth/me')
    .then(response => {
      if (!response.ok) {
        window.location.href = 'login.html';
      }
    })
    .catch(() => {
      window.location.href = 'login.html';
    });
}

function setupEventListeners() {
  document.getElementById('logout-link').addEventListener('click', logout);

  // Boutons d'action du profil
  const settingsBtn = document.querySelector('.btn-secondary');

  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettingsModal);
  }

  // Modal settings
  document.getElementById('close-settings').addEventListener('click', closeSettingsModal);
  document.getElementById('cancel-settings').addEventListener('click', closeSettingsModal);
  document.getElementById('settings-form').addEventListener('submit', saveSettings);

  // New interactive elements
  document.getElementById('toggle-details')?.addEventListener('click', toggleUserDetails);
  document.getElementById('show-email')?.addEventListener('click', () => toggleSensitiveInfo('email'));
  document.getElementById('show-discord-id')?.addEventListener('click', () => toggleSensitiveInfo('discord-id'));
  document.getElementById('mark-all-read')?.addEventListener('click', markAllNotificationsRead);
  document.getElementById('quick-settings')?.addEventListener('click', openSettingsModal);
  document.getElementById('view-devices')?.addEventListener('click', () => alert('Fonctionnalité à implémenter'));
  document.getElementById('view-history')?.addEventListener('click', () => alert('Fonctionnalité à implémenter'));
}

async function loadProfile() {
  try {
    const [userResponse, serversResponse, ticketsResponse, notificationsResponse, activityResponse] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/servers'),
      fetch('/api/tickets'),
      fetch('/api/notifications'),
      fetch('/api/activity')
    ]);

    const user = await userResponse.json();
    const servers = await serversResponse.json();
    const tickets = await ticketsResponse.json();
    const notifications = await notificationsResponse.json();
    const activities = await activityResponse.json();

    // Afficher les informations Discord
    document.getElementById('display-name').textContent = user.globalName || user.username;
    document.getElementById('username').textContent = user.username;
    document.getElementById('discriminator').textContent = user.discriminator || '0';
    document.getElementById('last-login').textContent = user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais';

    // Masquer les informations sensibles
    const email = user.email || 'Non fourni';
    const discordId = user.discordId || 'N/A';
    document.getElementById('email-masked').textContent = maskEmail(email);
    document.getElementById('discord-id-masked').textContent = maskDiscordId(discordId);

    // Store full values for toggle functionality
    document.getElementById('email-masked').dataset.full = email;
    document.getElementById('discord-id-masked').dataset.full = discordId;

    if (user.avatar) {
      document.getElementById('avatar').src = `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png`;
    } else {
      document.getElementById('avatar').src = '/asset/default-avatar.png'; // Placeholder
    }
    if (user.banner) {
      document.getElementById('banner').src = `https://cdn.discordapp.com/banners/${user.discordId}/${user.banner}.png`;
      document.getElementById('banner-container').style.display = 'block';
    } else {
      document.getElementById('banner-container').style.display = 'none';
    }

    // Statistiques
    const userServers = servers.filter(server => server.submittedBy === user.id);
    const userTickets = tickets.filter(ticket => ticket.userId === user.id);

    document.getElementById('servers-count').textContent = userServers.length;
    document.getElementById('tickets-count').textContent = userTickets.filter(t => t.status === 'open').length;
    document.getElementById('user-role').textContent = getRoleName(user.role);

    // Date d'inscription (simulée, à adapter selon l'API)
    document.getElementById('join-date').textContent = user.createdAt ? new Date(user.createdAt).getFullYear() : '2023';

    // Charger les notifications
    loadNotifications(notifications);

    // Charger l'activité récente
    loadActivity(activities);

  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Erreur lors du chargement du profil');
  }
}

function getRoleName(role) {
  const roles = {
    'user': 'Utilisateur',
    'moderator': 'Modérateur',
    'admin': 'Administrateur',
    'developer': 'Développeur'
  };
  return roles[role] || role;
}

function loadNotifications(notifications) {
  const notificationsList = document.getElementById('notifications-list');
  if (!notificationsList) return;

  notificationsList.innerHTML = '';

  if (notifications.length === 0) {
    notificationsList.innerHTML = '<p style="text-align: center; color: #888;">Aucune notification</p>';
    return;
  }

  notifications.slice(0, 5).forEach(notification => {
    const notificationItem = document.createElement('div');
    notificationItem.className = `notification-item ${notification.read ? '' : 'unread'} ${getNotificationTypeClass(notification.type)}`;
    notificationItem.dataset.id = notification.id;

    const iconMap = {
      'login': 'log-in',
      'server_approved': 'server',
      'server_submit': 'plus-circle',
      'ticket_open': 'message-square',
      'security_alert': 'alert-triangle'
    };

    const icon = iconMap[notification.type] || 'bell';

    notificationItem.innerHTML = `
      <div class="notification-icon">
        <i data-lucide="${icon}"></i>
      </div>
      <div class="notification-content">
        <p>${notification.message}</p>
        <span class="notification-time">${formatTime(notification.timestamp)}</span>
      </div>
    `;

    // Make notifications clickable to mark as read
    if (!notification.read) {
      notificationItem.addEventListener('click', () => markNotificationAsRead(notification.id));
    }

    notificationsList.appendChild(notificationItem);
  });

  // Re-initialize Lucide icons
  lucide.createIcons();
}

function loadActivity(activities) {
  const activityList = document.getElementById('activity-list');
  if (!activityList) return;

  activityList.innerHTML = '';

  if (activities.length === 0) {
    activityList.innerHTML = '<p style="text-align: center; color: #888;">Aucune activité récente</p>';
    return;
  }

  activities.slice(0, 5).forEach(activity => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item clickable';
    activityItem.dataset.type = activity.type;

    const iconMap = {
      'login': 'log-in',
      'server_submit': 'plus-circle',
      'ticket_open': 'message-square',
      'profile_update': 'edit'
    };

    const icon = iconMap[activity.type] || 'activity';

    activityItem.innerHTML = `
      <div class="activity-icon">
        <i data-lucide="${icon}"></i>
      </div>
      <div class="activity-content">
        <p>${activity.message}</p>
        <span class="activity-time">${formatTime(activity.timestamp)}</span>
      </div>
    `;

    // Make activities clickable
    activityItem.addEventListener('click', () => handleActivityClick(activity));

    activityList.appendChild(activityItem);
  });

  // Re-initialize Lucide icons
  lucide.createIcons();
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Il y a moins d\'une heure';
  } else if (diffHours < 24) {
    return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  } else if (diffDays < 7) {
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  } else {
    return date.toLocaleDateString('fr-FR');
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'landing.html';
  } catch (error) {
    console.error('Error logging out:', error);
    window.location.href = 'landing.html';
  }
}

function openSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'flex';

  // Load current user data
  fetch('/api/auth/me')
    .then(response => response.json())
    .then(user => {
      document.getElementById('settings-display-name').value = user.globalName || user.username || '';
      document.getElementById('settings-email').value = user.email || '';
      // For now, assume email notifications are enabled
      document.getElementById('email-notifications').checked = true;
    })
    .catch(error => console.error('Error loading user data:', error));
}

function closeSettingsModal() {
  const modal = document.getElementById('settings-modal');
  modal.style.display = 'none';
}

async function saveSettings(event) {
  event.preventDefault();

  const displayName = document.getElementById('settings-display-name').value;
  const email = document.getElementById('settings-email').value;
  const emailNotifications = document.getElementById('email-notifications').checked;

  try {
    const response = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        globalName: displayName,
        email: email,
        emailNotifications: emailNotifications
      })
    });

    if (response.ok) {
      alert('Paramètres sauvegardés avec succès');
      closeSettingsModal();
      // Reload profile data
      loadProfile();
    } else {
      alert('Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Erreur lors de la sauvegarde');
  }
}

// Utility functions for masking sensitive information
function maskEmail(email) {
  if (email === 'Non fourni') return email;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return email;
  return local.substring(0, 2) + '***@' + domain;
}

function maskDiscordId(discordId) {
  if (discordId === 'N/A') return discordId;
  if (discordId.length <= 4) return discordId;
  return discordId.substring(0, 4) + '***' + discordId.substring(discordId.length - 4);
}

// Toggle user details visibility
function toggleUserDetails() {
  const details = document.getElementById('user-details');
  const button = document.getElementById('toggle-details');
  if (details.style.display === 'none' || !details.style.display) {
    details.style.display = 'block';
    button.textContent = 'Masquer les détails';
  } else {
    details.style.display = 'none';
    button.textContent = 'Afficher les détails';
  }
}

// Toggle sensitive information visibility
function toggleSensitiveInfo(type) {
  const element = document.getElementById(`${type}-masked`);
  const isMasked = element.textContent.includes('***');
  element.textContent = isMasked ? element.dataset.full : (type === 'email' ? maskEmail(element.dataset.full) : maskDiscordId(element.dataset.full));
}

// Mark all notifications as read
async function markAllNotificationsRead() {
  try {
    const notificationsResponse = await fetch('/api/notifications');
    const notifications = await notificationsResponse.json();
    
    const unreadNotifications = notifications.filter(n => !n.read);
    
    // Mark each unread notification as read
    await Promise.all(unreadNotifications.map(notification =>
      fetch(`/api/notifications/${notification.id}/read`, { method: 'POST' })
    ));
    
    // Reload notifications
    loadProfile();
  } catch (error) {
    console.error('Error marking notifications as read:', error);
  }
}

// Mark single notification as read
async function markNotificationAsRead(notificationId) {
  try {
    await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
    loadProfile(); // Reload to update UI
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// Get notification type class for styling
function getNotificationTypeClass(type) {
  const typeMap = {
    'login': 'success',
    'server_approved': 'success',
    'server_submit': 'info',
    'ticket_open': 'info',
    'security_alert': 'error'
  };
  return typeMap[type] || 'info';
}

// Handle activity click
function handleActivityClick(activity) {
  switch (activity.type) {
    case 'server_submit':
      // Could redirect to server management page
      alert('Redirection vers la gestion des serveurs');
      break;
    case 'ticket_open':
      window.location.href = 'tickets.html';
      break;
    case 'profile_update':
      openSettingsModal();
      break;
    default:
      console.log('Activity clicked:', activity);
  }
}