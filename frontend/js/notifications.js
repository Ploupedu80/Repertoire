let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  loadNotifications();
  document.getElementById('logout-link').addEventListener('click', logout);

  // Refresh notifications every 10 seconds
  setInterval(loadNotifications, 10000);
});

async function checkLogin() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      window.location.href = 'login.html';
    }
  } catch (error) {
    window.location.href = 'login.html';
  }
}

async function loadNotifications() {
  try {
    const response = await fetch('/api/notifications');
    if (!response.ok) throw new Error('Failed to load notifications');

    const notifications = await response.json();
    displayNotifications(notifications);
  } catch (error) {
    console.error('Error loading notifications:', error);
    document.getElementById('notifications-list').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <p>Erreur lors du chargement des notifications</p>
      </div>
    `;
  }
}

function displayNotifications(allNotifications) {
  let notifications = allNotifications;

  // Filter notifications
  if (currentFilter !== 'all') {
    notifications = notifications.filter(n => n.type.includes(currentFilter));
  }

  const container = document.getElementById('notifications-list');

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>Aucune notification ${currentFilter !== 'all' ? 'dans cette catégorie' : ''}</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';
  
  // Sort by newest first
  notifications.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));

  notifications.forEach(notif => {
    const item = createNotificationItem(notif);
    container.appendChild(item);
  });
}

function createNotificationItem(notif) {
  const item = document.createElement('div');
  item.className = `notification-item ${notif.type.split('_')[0]} ${!notif.read ? 'unread' : ''}`;

  const icons = {
    ticket_open: '🎫',
    ticket_response: '💬',
    ticket_status: '⚡',
    sanction_warning: '⚠️',
    sanction_mute: '🔇',
    sanction_kick: '👢',
    sanction_ban: '🚫',
    server_suspended: '⛔',
    server_approved: '✅',
    system_announcement: '📢'
  };

  const badgeClasses = {
    'ticket': 'badge-ticket',
    'sanction': 'badge-sanction',
    'server': 'badge-server',
    'system': 'badge-system'
  };

  const typePrefix = notif.type.split('_')[0];
  const badgeClass = badgeClasses[typePrefix] || 'badge-system';

  const date = new Date(notif.timestamp || notif.createdAt);
  const timeAgo = getTimeAgo(date);

  item.innerHTML = `
    <div style="display: flex; align-items: start; flex: 1;">
      <div class="notification-icon">${icons[notif.type] || '🔔'}</div>
      <div class="notification-content">
        <h3 class="notification-title">
          <span class="notification-badge ${badgeClass}">${notif.type.split('_')[0]}</span>
          ${notif.title}
        </h3>
        <p class="notification-message">${notif.message}</p>
        <span class="notification-date">${timeAgo}</span>
      </div>
    </div>
    <div class="notification-actions">
      ${!notif.read ? `<button class="notification-action-btn notification-read-btn" onclick="markAsRead('${notif.id}')" title="Marquer comme lu">✓</button>` : ''}
      <button class="notification-action-btn" onclick="deleteNotification('${notif.id}')" title="Supprimer">✕</button>
    </div>
  `;

  return item;
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'À l\'instant';
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `Il y a ${Math.floor(seconds / 86400)}j`;
  
  return date.toLocaleDateString('fr-FR');
}

function filterNotifications(type) {
  currentFilter = type;

  // Update filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  loadNotifications();
}

async function markAsRead(notificationId) {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });

    if (response.ok) {
      loadNotifications();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

async function markAllAsRead() {
  try {
    const response = await fetch('/api/notifications/all/read', {
      method: 'PATCH'
    });

    if (response.ok) {
      loadNotifications();
    }
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

async function deleteNotification(notificationId) {
  try {
    const response = await fetch(`/api/notifications/${notificationId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      loadNotifications();
    }
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
}

async function clearAll() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les notifications?')) return;

  try {
    const response = await fetch('/api/notifications/all', {
      method: 'DELETE'
    });

    if (response.ok) {
      loadNotifications();
    }
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error logging out:', error);
  }
}
