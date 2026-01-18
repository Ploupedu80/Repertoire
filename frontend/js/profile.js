// profile.js - Gestion du profil utilisateur

// Initialize Lucide icons on page load
if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProfile();
  setupEventListeners();
  
  // Re-initialize Lucide icons after DOM is fully loaded
  if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
    setTimeout(() => lucide.createIcons(), 100);
  }
});

function checkAuth() {
  fetch('/api/auth/me')
    .then(response => {
      if (!response.ok) {
        window.location.href = 'login.html';
        return;
      }
      return response.json();
    })
    .then(async user => {
      if (user && user.blacklisted) {
        showBlacklistModal(user);
        return;
      }
      
      // Check for active ban sanctions
      try {
        const sanctionsResponse = await fetch('/api/users/sanctions');
        if (sanctionsResponse.ok) {
          const sanctions = await sanctionsResponse.json();
          const activeBans = sanctions.filter(s => 
            s.active && 
            (s.type === 'ban_temp' || s.type === 'ban_perm') &&
            (s.type === 'ban_perm' || (s.expiresAt && new Date(s.expiresAt) > new Date()))
          );
          
          if (activeBans.length > 0) {
            const ban = activeBans[0]; // Take the first active ban
            showBanModal(user, ban);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to check sanctions:', error);
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
    const userResponse = await fetch('/api/auth/me');
    const user = await userResponse.json();

    let servers = [];
    let tickets = [];
    let notifications = [];
    let activities = [];
    let sanctions = [];

    try {
      const serversResponse = await fetch('/api/servers');
      servers = await serversResponse.json();
    } catch (error) {
      console.warn('Failed to load servers:', error);
    }

    try {
      const ticketsResponse = await fetch('/api/tickets');
      tickets = await ticketsResponse.json();
    } catch (error) {
      console.warn('Failed to load tickets:', error);
    }

    try {
      const notificationsResponse = await fetch('/api/notifications');
      notifications = await notificationsResponse.json();
    } catch (error) {
      console.warn('Failed to load notifications:', error);
    }

    try {
      const activityResponse = await fetch('/api/activity');
      activities = await activityResponse.json();
    } catch (error) {
      console.warn('Failed to load activities:', error);
    }

    try {
      const sanctionsResponse = await fetch('/api/users/sanctions');
      sanctions = await sanctionsResponse.json();
    } catch (error) {
      console.warn('Failed to load sanctions:', error);
    }

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

    // Charger les notifications
    loadNotifications(notifications);

    // Charger l'activité récente (tickets)
    loadActivity(tickets);

    // Charger les sanctions
    loadSanctions(sanctions);

    // Vérifier les sanctions actives et afficher un avertissement
    checkActiveSanctions(sanctions);

    // Charger les serveurs de l'utilisateur
    loadUserServers(user.id, servers, user);

    // Charger les boutons de modération selon le rôle
    loadModerationButtons(user);

    // Charger les statistiques et favoris
    loadUserStats(user.id);
    loadUserFavorites();

  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Erreur lors du chargement du profil');
  }
}

async function loadModerationButtons(user) {
  const containerDiv = document.getElementById('moderation-buttons');
  const buttonDiv = document.getElementById('role-specific-buttons');

  // Vérifier le rôle de l'utilisateur
  const role = user.role;

  if (!['developer', 'admin', 'moderator'].includes(role)) {
    containerDiv.style.display = 'none';
    return;
  }

  containerDiv.style.display = 'block';
  buttonDiv.innerHTML = '';

  // Boutons pour Développeur
  if (role === 'developer') {
    buttonDiv.innerHTML += `
      <a href="moderation.html" class="quick-action-btn" style="flex: 1; min-width: 150px;">
        <i data-lucide="shield-alert"></i>
        Panneau de Modération
      </a>
    `;
  }

  // Boutons pour Admin
  if (role === 'admin') {
    buttonDiv.innerHTML += `
      <a href="moderation.html" class="quick-action-btn" style="flex: 1; min-width: 150px;">
        <i data-lucide="gavel"></i>
        Gérer les Sanctions
      </a>
    `;
  }

  // Boutons pour Modérateur
  if (role === 'moderator') {
    buttonDiv.innerHTML += `
      <a href="moderation.html" class="quick-action-btn" style="flex: 1; min-width: 150px;">
        <i data-lucide="message-square"></i>
        Gérer les Tickets
      </a>
    `;
  }

  // Réinitialiser les icônes Lucide
  if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
    lucide.createIcons();
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
  if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
    lucide.createIcons();
  }
}

function loadActivity(activities) {
  const activityList = document.getElementById('activity-list');
  if (!activityList) return;

  activityList.innerHTML = '';

  // activities now contains tickets
  const tickets = activities;

  if (tickets.length === 0) {
    activityList.innerHTML = '<p style="text-align: center; color: #888;">Aucun ticket</p>';
    return;
  }

  // Sort tickets by updated date (most recent first)
  const sortedTickets = [...tickets].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  sortedTickets.slice(0, 5).forEach(ticket => {
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item clickable';
    activityItem.dataset.type = 'ticket';
    activityItem.dataset.ticketId = ticket.id;

    // Determine status icon and color
    const statusIcons = {
      'open': 'circle-dot',
      'in-progress': 'circle-dot',
      'resolved': 'check-circle',
      'closed': 'x-circle'
    };

    const statusColors = {
      'open': '#fbbf24',
      'in-progress': '#60a5fa',
      'resolved': '#34d399',
      'closed': '#9ca3af'
    };

    const statusEmojis = {
      'open': '🟡',
      'in-progress': '🔵',
      'resolved': '🟢',
      'closed': '⚫'
    };

    const priorityEmojis = {
      'low': '⬇️',
      'normal': '➡️',
      'high': '⬆️',
      'urgent': '🔴'
    };

    const statusColor = statusColors[ticket.status] || '#64748b';
    const statusIcon = statusEmojis[ticket.status] || '❓';
    const priorityIcon = priorityEmojis[ticket.priority] || '❓';
    const responseCount = (ticket.responses || []).length;

    activityItem.innerHTML = `
      <div class="activity-icon" style="background-color: ${statusColor}20; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <span style="font-size: 20px;">${statusIcon}</span>
      </div>
      <div class="activity-content">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">${ticket.subject}</p>
        <div style="display: flex; gap: 1rem; font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
          <span>${statusEmojis[ticket.status]} ${ticket.status.replace('-', ' ')}</span>
          <span>${priorityIcon} ${ticket.priority}</span>
          <span>💬 ${responseCount} réponse${responseCount !== 1 ? 's' : ''}</span>
        </div>
        <span class="activity-time">${formatTime(ticket.updatedAt)}</span>
      </div>
    `;

    // Make activities clickable to go to tickets page
    activityItem.addEventListener('click', () => {
      window.location.href = 'tickets.html';
    });

    activityList.appendChild(activityItem);
  });

  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
    lucide.createIcons();
  }
}

function loadSanctions(sanctions) {
  const sanctionsList = document.getElementById('sanctions-list');
  if (!sanctionsList) return;

  sanctionsList.innerHTML = '';

  if (sanctions.length === 0) {
    sanctionsList.innerHTML = '<p style="text-align: center; color: #888;">Aucune sanction</p>';
    return;
  }

  // Sort sanctions by applied date (most recent first)
  const sortedSanctions = [...sanctions].sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  sortedSanctions.forEach(sanction => {
    const sanctionItem = document.createElement('div');
    sanctionItem.className = 'activity-item';

    const typeEmojis = {
      'avertissement_oral': '🗣️',
      'avertissement_1': '⚠️',
      'avertissement_2': '🚨',
      'ban_temp': '⏰',
      'ban_perm': '🚫',
      'blacklist': '🚷'
    };

    const typeColors = {
      'avertissement_oral': '#fbbf24',
      'avertissement_1': '#f59e0b',
      'avertissement_2': '#ef4444',
      'ban_temp': '#7c2d12',
      'ban_perm': '#dc2626',
      'blacklist': '#1f2937'
    };

    const typeLabels = {
      'avertissement_oral': 'Avertissement Oral',
      'avertissement_1': 'Avertissement Écrit 1',
      'avertissement_2': 'Avertissement Écrit 2',
      'ban_temp': 'Bannissement Temporaire',
      'ban_perm': 'Bannissement Permanent',
      'blacklist': 'Blacklist'
    };

    const typeEmoji = typeEmojis[sanction.type] || '❓';
    const typeColor = typeColors[sanction.type] || '#64748b';
    const typeLabel = typeLabels[sanction.type] || sanction.type.charAt(0).toUpperCase() + sanction.type.slice(1);
    const appliedDate = new Date(sanction.appliedAt).toLocaleString('fr-FR');
    const expiresText = sanction.expiresAt ? `Expire le ${new Date(sanction.expiresAt).toLocaleString('fr-FR')}` : 'Permanent';
    const activeText = sanction.active ? 'Active' : 'Expirée';

    sanctionItem.innerHTML = `
      <div class="activity-icon" style="background-color: ${typeColor}20; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        <span style="font-size: 20px;">${typeEmoji}</span>
      </div>
      <div class="activity-content">
        <p style="margin: 0; font-weight: 600; color: #1e293b;">${typeLabel}</p>
        <p style="margin: 0.25rem 0; color: #64748b; font-size: 0.9rem;">${sanction.reason}</p>
        <div style="display: flex; gap: 1rem; font-size: 0.85rem; color: #64748b; margin-top: 0.25rem;">
          <span>Par: ${sanction.appliedBy}</span>
          <span>${expiresText}</span>
          <span style="color: ${sanction.active ? '#ef4444' : '#34d399'};">${activeText}</span>
        </div>
        <span class="activity-time">${appliedDate}</span>
      </div>
    `;

    sanctionsList.appendChild(sanctionItem);
  });

  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
    lucide.createIcons();
  }
}

function checkActiveSanctions(sanctions) {
  const activeSanctions = sanctions.filter(s => s.active);

  if (activeSanctions.length > 0) {
    const typeLabels = {
      'avertissement_oral': 'Avertissement Oral',
      'avertissement_1': 'Avertissement Écrit 1',
      'avertissement_2': 'Avertissement Écrit 2',
      'ban_temp': 'Bannissement Temporaire',
      'ban_perm': 'Bannissement Permanent',
      'blacklist': 'Blacklist'
    };

    // Create modal for sanctions warning
    const modal = document.createElement('div');
    modal.id = 'sanctions-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 500px;">
        <div class="modal-header">
          <h2 style="color: #ef4444;">⚠️ Avertissement de Sanction</h2>
        </div>
        <div class="modal-body">
          <p>Vous avez ${activeSanctions.length} sanction${activeSanctions.length > 1 ? 's' : ''} active${activeSanctions.length > 1 ? 's' : ''} :</p>
          <div id="active-sanctions-list" style="margin: 1rem 0;">
            ${activeSanctions.map(s => `
              <div style="border-left: 4px solid #ef4444; padding-left: 1rem; margin: 0.5rem 0; background: #fef2f2;">
                <strong>${typeLabels[s.type] || s.type.charAt(0).toUpperCase() + s.type.slice(1)}</strong><br>
                <small>Raison: ${s.reason}</small><br>
                <small>Appliquée le: ${new Date(s.appliedAt).toLocaleString('fr-FR')}</small><br>
                <small>${s.expiresAt ? `Expire le: ${new Date(s.expiresAt).toLocaleString('fr-FR')}` : 'Permanente'}</small>
              </div>
            `).join('')}
          </div>
          <p style="color: #dc2626; font-weight: bold;">Veuillez respecter les règles de la communauté.</p>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" onclick="closeSanctionsModal()">J'ai compris</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Prevent closing by clicking outside
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        // Don't close
      }
    });
  }
}

function closeSanctionsModal() {
  const modal = document.getElementById('sanctions-modal');
  if (modal) {
    modal.remove();
  }
}

function showBlacklistModal(user) {
  // Create modal for blacklist
  const modal = document.createElement('div');
  modal.id = 'blacklist-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2 style="color: #dc2626;">🚫 Accès Refusé - Blacklist</h2>
      </div>
      <div class="modal-body">
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">Votre compte a été blacklisté et vous ne pouvez plus accéder au site.</p>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
          <h3 style="color: #dc2626; margin: 0 0 0.5rem 0;">Détails de la sanction :</h3>
          <p style="margin: 0.25rem 0;"><strong>Raison :</strong> ${user.blacklistReason || 'Non spécifiée'}</p>
          <p style="margin: 0.25rem 0;"><strong>Date :</strong> ${user.blacklistedAt ? new Date(user.blacklistedAt).toLocaleString('fr-FR') : 'N/A'}</p>
          <p style="margin: 0.25rem 0;"><strong>Par :</strong> ${user.blacklistedBy || 'N/A'}</p>
        </div>
        
        <p style="color: #374151; margin: 1rem 0;">
          Si vous pensez que cette sanction est injustifiée, vous pouvez faire appel en créant un ticket de modération.
        </p>
      </div>
      <div class="modal-footer" style="flex-direction: column; gap: 0.5rem;">
        <button class="btn-primary" onclick="createAppealTicket('${user.blacklistReason || ''}')">📝 Faire un Appel</button>
        <button class="btn-secondary" onclick="logout()">Se Déconnecter</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Prevent closing by clicking outside or ESC
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      // Don't close
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
    }
  });
}

function showBanModal(user, ban) {
  const isPermanent = ban.type === 'ban_perm';
  const timeLeft = isPermanent ? null : calculateTimeLeft(ban.expiresAt);
  
  // Create modal for ban
  const modal = document.createElement('div');
  modal.id = 'ban-modal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 600px;">
      <div class="modal-header">
        <h2 style="color: #dc2626;">🚫 Accès Refusé - Bannissement</h2>
      </div>
      <div class="modal-body">
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">Votre compte a été banni et vous ne pouvez pas accéder au site pendant la durée de la sanction.</p>
        
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin: 1rem 0;">
          <h3 style="color: #dc2626; margin: 0 0 0.5rem 0;">Détails de la sanction :</h3>
          <p style="margin: 0.25rem 0;"><strong>Type :</strong> ${ban.type === 'ban_temp' ? 'Bannissement Temporaire' : 'Bannissement Permanent'}</p>
          <p style="margin: 0.25rem 0;"><strong>Raison :</strong> ${ban.reason}</p>
          <p style="margin: 0.25rem 0;"><strong>Date :</strong> ${new Date(ban.appliedAt).toLocaleString('fr-FR')}</p>
          <p style="margin: 0.25rem 0;"><strong>Par :</strong> ${ban.appliedBy}</p>
          ${!isPermanent ? `<p style="margin: 0.25rem 0;"><strong>Temps restant :</strong> <span id="time-left">${timeLeft}</span></p>` : '<p style="margin: 0.25rem 0;"><strong>Durée :</strong> Permanent</p>'}
        </div>
        
        <p style="color: #374151; margin: 1rem 0;">
          Si vous pensez que cette sanction est injustifiée, vous pouvez faire appel en créant un ticket de modération.
        </p>
      </div>
      <div class="modal-footer" style="flex-direction: column; gap: 0.5rem;">
        <button class="btn-primary" onclick="createAppealTicket('${ban.reason}')">📝 Faire un Appel</button>
        <button class="btn-secondary" onclick="logout()">Se Déconnecter</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Update time left every second for temporary bans
  if (!isPermanent) {
    const timeLeftElement = document.getElementById('time-left');
    const updateTimer = () => {
      const remaining = calculateTimeLeft(ban.expiresAt);
      if (timeLeftElement) {
        timeLeftElement.textContent = remaining;
        if (remaining === 'Expiré') {
          // Reload page to check if ban is still active
          setTimeout(() => window.location.reload(), 1000);
        }
      }
    };
    setInterval(updateTimer, 1000);
  }

  // Prevent closing by clicking outside or ESC
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      // Don't close
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
    }
  });
}

function calculateTimeLeft(expiresAt) {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;
  
  if (diff <= 0) return 'Expiré';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (days > 0) return `${days}j ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function createAppealTicket(reason) {
  // Redirect to tickets page with appeal context
  window.location.href = 'tickets.html?appeal=true&reason=' + encodeURIComponent(reason);
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

// Load user's servers
function loadUserServers(userId, allServers, user) {
  // Filter servers by user (submittedBy = userId)
  const userServers = allServers.filter(s => s.submittedBy === userId);

  // Separate by status
  const activeServers = userServers.filter(s => s.status === 'approved' && !s.suspended);
  const suspendedServers = userServers.filter(s => s.suspended === true);
  const pendingServers = userServers.filter(s => s.status === 'pending');

  // Show referent badge if user has servers
  if (userServers.length > 0) {
    const badge = document.getElementById('referent-badge');
    if (badge) {
      badge.style.display = 'inline-flex';
    }
  }

  // Load active servers
  if (activeServers.length > 0) {
    const activeSection = document.getElementById('servers-section');
    const activeList = document.getElementById('active-servers-list');
    if (activeSection && activeList) {
      activeSection.style.display = 'block';
      displayServerList(activeServers, activeList, user);
    }
  }

  // Load suspended servers
  if (suspendedServers.length > 0) {
    const suspendedSection = document.getElementById('suspended-servers-section');
    const suspendedList = document.getElementById('suspended-servers-list');
    if (suspendedSection && suspendedList) {
      suspendedSection.style.display = 'block';
      displayServerList(suspendedServers, suspendedList, user);
    }
  }

  // Load pending servers
  if (pendingServers.length > 0) {
    const pendingSection = document.getElementById('pending-servers-section');
    const pendingList = document.getElementById('pending-servers-list');
    if (pendingSection && pendingList) {
      pendingSection.style.display = 'block';
      displayServerList(pendingServers, pendingList, user);
    }
  }

  // Re-initialize Lucide icons
  if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
    lucide.createIcons();
  }
}

// Display a list of servers
function displayServerList(servers, container, user) {
  container.innerHTML = '';

  if (servers.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #888;">Aucun serveur</p>';
    return;
  }

  servers.forEach(server => {
    const serverDiv = document.createElement('div');
    serverDiv.className = 'server-item';
    
    const statusBadge = server.suspended ? '🔴 Suspendu' : (server.status === 'pending' ? '⏳ En attente' : '✅ Actif');
    const statusColor = server.suspended ? '#ff6b6b' : (server.status === 'pending' ? '#f59e0b' : '#51cf66');

    serverDiv.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div>
          <h4 style="margin: 0 0 0.5rem 0; color: #1e293b;">${server.name}</h4>
          <p style="margin: 0 0 0.5rem 0; color: #64748b; font-size: 0.95rem;">${server.description || 'Aucune description'}</p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
            ${server.tags.slice(0, 3).map(tag => `<span style="background: #e2e8f0; color: #475569; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem;">${tag}</span>`).join('')}
          </div>
        </div>
        <span style="background: ${statusColor}20; color: ${statusColor}; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; white-space: nowrap;">${statusBadge}</span>
      </div>
      <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
        <button class="btn btn-primary" onclick="editServerFromProfile('${server.id}')">Modifier</button>
        ${server.suspended ? `<button class="btn btn-warning" onclick="makeAppealFromProfile('${server.id}')">Faire appel</button>` : ''}
      </div>
    `;

    container.appendChild(serverDiv);
  });
}

// Edit server from profile
function editServerFromProfile(serverId) {
  window.location.href = `edit-server.html?id=${serverId}`;
}

// Make appeal from profile
function makeAppealFromProfile(serverId) {
  // Store server ID for modal
  window.currentAppealServerId = serverId;
  // You could open a modal or redirect to the server page
  alert('Redirection vers la page de contestation...');
}

// === STATISTIQUES ET FAVORIS ===
async function loadUserStats(userId) {
  try {
    // Charger les serveurs soumis
    const serversResponse = await fetch('/api/servers');
    const allServers = await serversResponse.json();
    const userServers = allServers.filter(s => s.submittedBy === userId);
    
    // Charger les avis
    const ratingsResponse = await fetch('/api/ratings');
    const allRatings = ratingsResponse.ok ? await ratingsResponse.json() : [];
    
    // Charger les tickets
    const ticketsResponse = await fetch('/api/tickets');
    const allTickets = ticketsResponse.ok ? await ticketsResponse.json() : [];
    const openTickets = allTickets.filter(t => t.status !== 'closed' && t.status !== 'resolved').length;

    // Charger les favoris
    const favoritesResponse = await fetch('/api/favorites');
    const favorites = favoritesResponse.ok ? await favoritesResponse.json() : [];

    // Mettre à jour les statistiques
    document.getElementById('stat-servers-submitted').textContent = userServers.length;
    document.getElementById('stat-reviews-given').textContent = allRatings.length;
    document.getElementById('stat-favorites').textContent = favorites.length;
    document.getElementById('stat-open-tickets').textContent = openTickets;

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadUserFavorites() {
  try {
    const favoritesResponse = await fetch('/api/favorites');
    const favorites = favoritesResponse.ok ? await favoritesResponse.json() : [];

    const serversResponse = await fetch('/api/servers');
    const allServers = await serversResponse.json();

    const favoritesContainer = document.getElementById('favorites-list');
    
    if (favorites.length === 0) {
      favoritesContainer.innerHTML = '<p style="color: #b0b0b0; grid-column: 1 / -1;">Vous n\'avez pas de serveurs favoris pour le moment.</p>';
      return;
    }

    favoritesContainer.innerHTML = favorites.map(fav => {
      const server = allServers.find(s => s.id === fav.serverId);
      if (!server) return '';
      
      const avgRating = server.averageRating || 0;
      const stars = generateStars(avgRating);

      return `
        <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid #00d4ff; border-radius: 8px; padding: 1rem; cursor: pointer; transition: all 0.3s; text-decoration: none; color: inherit;" onclick="window.location.href='index.html'">
          <div style="display: flex; gap: 0.75rem; margin-bottom: 0.5rem;">
            <img src="${server.icon || '/asset/default-icon.png'}" alt="${server.name}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover; border: 1px solid #00d4ff;" onerror="this.src='/asset/default-icon.png'">
            <div style="flex: 1;">
              <p style="margin: 0; color: #fff; font-weight: 600; font-size: 0.95rem;">${server.name}</p>
              <p style="margin: 0.25rem 0 0 0; color: #b0b0b0; font-size: 0.85rem;">${server.category || 'Général'}</p>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;">
            <span style="color: #00d4ff;">${stars}</span>
            <span style="color: #b0b0b0;">${server.memberCount} membres</span>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error loading favorites:', error);
  }
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  let stars = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars += '★';
    } else if (i === fullStars && hasHalf) {
      stars += '◐';
    } else {
      stars += '☆';
    }
  }
  
  return stars;
}