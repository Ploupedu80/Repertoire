// app.js - Main application logic

document.addEventListener('DOMContentLoaded', () => {
  loadServers();
  loadAnnouncements();
  checkLoginStatus();
  setupEventListeners();
});

let allServers = [];
let currentUser = null;

function setupEventListeners() {
  document.getElementById('search').addEventListener('input', filterServers);
  document.getElementById('filter-toggle').addEventListener('click', toggleFilterModal);
  document.getElementById('close-filter-modal').addEventListener('click', closeFilterModal);
  document.getElementById('apply-filters').addEventListener('click', applyFilters);
  document.getElementById('reset-filters').addEventListener('click', resetFilters);
  document.getElementById('home-link').addEventListener('click', () => window.location.href = 'landing.html');
  document.getElementById('submit-link').addEventListener('click', () => window.location.href = 'submit.html');
  document.getElementById('profile-link').addEventListener('click', () => window.location.href = 'profile.html');
  document.getElementById('support-link').addEventListener('click', () => window.location.href = 'tickets.html');
  document.getElementById('login-link').addEventListener('click', () => window.location.href = 'login.html');
  document.getElementById('admin-link').addEventListener('click', () => window.location.href = 'admin.html');
  document.getElementById('logout-link').addEventListener('click', logout);

  // Close modal when clicking outside
  document.getElementById('filter-modal').addEventListener('click', (e) => {
    if (e.target.id === 'filter-modal') {
      closeFilterModal();
    }
  });
}

async function checkLoginStatus() {
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      currentUser = await response.json();
      document.getElementById('login-link').style.display = 'none';
      document.getElementById('logout-link').style.display = 'inline';
      document.getElementById('support-link').style.display = 'inline';
      document.getElementById('profile-link').style.display = 'inline';
      if (['admin', 'moderator', 'developer'].includes(currentUser.role)) {
        document.getElementById('admin-link').style.display = 'inline';
      }
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

async function loadServers() {
  try {
    const [serversResponse, userResponse] = await Promise.all([
      fetch('/api/servers'),
      fetch('/api/auth/me').catch(() => null)
    ]);

    const servers = await serversResponse.json();
    const user = userResponse && userResponse.ok ? await userResponse.json() : null;
    currentUser = user;

    // Filter out suspended servers
    allServers = servers.filter(s => !s.suspended);
    displayServers(allServers, user);
  } catch (error) {
    console.error('Error loading servers:', error);
  }
}

function displayServers(servers, user = null) {
  const container = document.getElementById('server-list');
  container.innerHTML = '';
  servers.forEach(server => {
    const card = createServerCard(server, user);
    container.appendChild(card);
  });

  // Ajouter les event listeners pour les boutons d'édition
  if (user) {
    document.querySelectorAll('.edit-server-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Empêcher la propagation du clic
        const serverId = e.target.dataset.serverId;
        editServer(serverId);
      });
    });
  }
}

function createServerCard(server, user = null) {
  const card = document.createElement('div');
  card.className = 'server-card';
  const isOwner = user && server.submittedBy === user.id;

  const activityClass = server.activityLevel.toLowerCase();

  card.innerHTML = `
    ${server.banner ? `<img src="${server.banner}" alt="${server.name}" class="server-banner">` : ''}
    <div class="server-info">
      <h3>${server.name}</h3>
      <p class="server-description">${server.description || 'Aucune description disponible.'}</p>
      <div class="server-tags">
        ${server.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
        ${server.tags.length > 3 ? `<span class="tag">+${server.tags.length - 3}</span>` : ''}
      </div>
      <div class="server-meta">
        <span>${server.memberCount} membres</span>
        <span class="activity-badge ${activityClass}">${server.activityLevel}</span>
      </div>
      <button class="btn btn-primary join-btn">Voir</button>
    </div>
    ${isOwner ? `<button class="btn btn-secondary edit-server-btn" data-server-id="${server.id}">Modifier</button>` : ''}
  `;

  // Ajouter l'événement de clic pour ouvrir les détails
  card.addEventListener('click', (e) => {
    // Ne pas ouvrir si on clique sur le bouton modifier
    if (!e.target.classList.contains('edit-server-btn') && !e.target.classList.contains('join-btn')) {
      showServerDetails(server, user);
    }
  });

  // Ajouter l'événement pour le bouton Voir
  const joinBtn = card.querySelector('.join-btn');
  if (joinBtn) {
    joinBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showServerDetails(server, user);
    });
  }

  return card;
}

function showServerDetails(server, user = null) {
  const isOwner = user && server.submittedBy === user.id;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content server-details-modal">
      <div class="modal-header">
        <h2>${server.name}</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        ${server.banner ? `<img src="${server.banner}" alt="${server.name}" class="server-detail-banner">` : ''}
        ${server.icon ? `<img src="${server.icon}" alt="${server.name} icon" class="server-detail-icon">` : ''}
        
        <div class="server-details-grid">
          <div class="detail-item">
            <strong>Type:</strong> ${server.serverType}
          </div>
          <div class="detail-item">
            <strong>Membres:</strong> ${server.memberCount}
          </div>
          <div class="detail-item">
            <strong>Activité:</strong> ${server.activityLevel}
          </div>
          <div class="detail-item">
            <strong>Statut:</strong> ${server.status === 'approved' ? 'Approuvé' : server.status === 'pending' ? 'En attente' : 'Rejeté'}
          </div>
        </div>
        
        <div class="server-description">
          <h4>Description</h4>
          <p>${server.description}</p>
        </div>
        
        <div class="server-tags-detail">
          <h4>Tags</h4>
          <div class="tags-container">
            ${server.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
        
        <div class="server-actions">
          <a href="${server.inviteLink}" class="btn btn-primary" target="_blank">Rejoindre le serveur</a>
          ${isOwner ? `<button class="btn btn-secondary edit-server-btn" data-server-id="${server.id}">Modifier</button>` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Fermer le modal
  modal.querySelector('.modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // Gestion du bouton modifier dans le modal
  if (isOwner) {
    modal.querySelector('.edit-server-btn').addEventListener('click', (e) => {
      document.body.removeChild(modal);
      editServer(server.id);
    });
  }
}

function editServer(serverId) {
  // Rediriger vers la page d'édition avec l'ID du serveur
  window.location.href = `edit-server.html?id=${serverId}`;
}

function filterServers() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const typeFilter = document.getElementById('type-filter').value;
  const activityFilter = document.getElementById('activity-filter').value;

  // Filtrer les serveurs en mémoire
  const filteredServers = allServers.filter(server => {
    const matchesSearch = server.name.toLowerCase().includes(searchTerm);
    const matchesType = !typeFilter || server.serverType === typeFilter;
    const matchesActivity = !activityFilter || server.activityLevel === activityFilter;
    return matchesSearch && matchesType && matchesActivity;
  });

  displayServers(filteredServers, currentUser);
}

function toggleFilterModal() {
  const modal = document.getElementById('filter-modal');
  const toggleBtn = document.getElementById('filter-toggle');

  if (modal.style.display === 'none' || modal.style.display === '') {
    modal.style.display = 'flex';
    toggleBtn.classList.add('active');
  } else {
    closeFilterModal();
  }
}

function closeFilterModal() {
  const modal = document.getElementById('filter-modal');
  const toggleBtn = document.getElementById('filter-toggle');

  modal.style.display = 'none';
  toggleBtn.classList.remove('active');
}

function applyFilters() {
  filterServers();
  closeFilterModal();
}

function resetFilters() {
  document.getElementById('type-filter').value = '';
  document.getElementById('activity-filter').value = '';
  document.getElementById('language-filter').value = '';
  filterServers();
  closeFilterModal();
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

async function loadAnnouncements() {
  try {
    const response = await fetch('/api/announcements');
    const announcements = await response.json();
    if (announcements.length > 0) {
      const banner = document.getElementById('announcements-banner');
      banner.innerHTML = announcements.map(a => `<div class="announcement-banner">${a.title}: ${a.message}</div>`).join('');
      banner.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading announcements:', error);
  }
}