const API_BASE = 'http://localhost:3000/api';
let currentUser = null;
let userRole = null;

// Récupérer les informations de l'utilisateur
async function loadUserInfo() {
  try {
    // Vérifier d'abord si l'utilisateur est connecté via Passport
    const meResponse = await fetch(`${API_BASE}/auth/me`);
    if (!meResponse.ok) {
      window.location.href = 'login.html';
      return;
    }

    const user = await meResponse.json();
    
    // Check if user is blacklisted
    if (user.blacklisted) {
      showBlacklistModal(user);
      return;
    }
    
    // Check for active ban sanctions
    const sanctionsResponse = await fetch(`${API_BASE}/users/sanctions`);
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
    
    const response = await fetch(`${API_BASE}/moderation/user-role/${user.id || user.discordId}`);
    const data = await response.json();

    currentUser = data;
    userRole = data.role;

    document.getElementById('user-info').textContent = `Connecté en tant que: ${data.globalName || data.username}`;
    document.getElementById('role-badge').textContent = data.role.toUpperCase();
    document.getElementById('role-badge').className = `role-badge ${data.role}`;

    // Vérifier les permissions
    const hasAccess = ['developer', 'admin', 'moderator'].includes(data.role);

    if (!hasAccess) {
      document.getElementById('access-denied').style.display = 'block';
      document.getElementById('moderation-panel').style.display = 'none';
      return;
    }

    document.getElementById('moderation-panel').style.display = 'block';

    // Afficher/masquer les onglets selon le rôle
    setupTabs();
    loadInitialData();
  } catch (error) {
    console.error('Erreur lors du chargement des infos utilisateur:', error);
    window.location.href = 'login.html';
  }
}

// Configuration des onglets selon le rôle
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');

  tabs.forEach(tab => {
    const tabName = tab.getAttribute('data-tab');

    // Masquer les onglets non autorisés
    if (userRole === 'moderator') {
      // Modérateur ne peut voir que les tickets
      if (['announcements', 'manage', 'servers', 'partners', 'personnel'].includes(tabName)) {
        tab.style.display = 'none';
      }
    } else if (userRole === 'admin') {
      // Admin ne peut pas voir les annonces, manage, serveurs et partenaires, mais peut voir personnel
      if (['announcements', 'manage', 'servers', 'partners'].includes(tabName)) {
        tab.style.display = 'none';
      }
    }
    // Développeur voit tout
  });

  // Gestionnaires de clic des onglets
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Configuration des sous-onglets pour l'onglet "Gérer"
  setupSubTabs();
}

function setupSubTabs() {
  const subTabs = document.querySelectorAll('.sub-tab-btn');

  subTabs.forEach(subTab => {
    subTab.addEventListener('click', () => {
      const subTabName = subTab.getAttribute('data-subtab');
      switchSubTab(subTabName);
    });
  });
}

function switchSubTab(subTabName) {
  // Masquer tous les sous-onglets
  document.querySelectorAll('.sub-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.querySelectorAll('.sub-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Afficher le sous-onglet actif
  document.getElementById(`manage-${subTabName}`).classList.add('active');
  document.querySelector(`[data-subtab="${subTabName}"]`).classList.add('active');

  // Charger le contenu approprié
  switch (subTabName) {
    case 'sanctions':
      loadSanctionsList();
      break;
    case 'blacklist':
      loadBlacklist();
      break;
    case 'history':
      loadSanctionsHistory();
      break;
  }
}

// Changer d'onglet
function switchTab(tabName) {
  // Masquer tous les onglets
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });

  // Afficher l'onglet actif
  document.getElementById(tabName).classList.add('active');
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

  // Charger le contenu approprié
  switch (tabName) {
    case 'manage':
      loadSanctionsList();
      break;
    case 'servers':
      loadServers();
      break;
    case 'reviews':
      loadReviewsList();
      break;
    case 'tickets':
      loadTickets();
      break;
    case 'partners':
      loadPartners();
      break;
    case 'personnel':
      loadPersonnel();
      break;
  }
}

// === GESTION DES SERVEURS ===
async function loadServers() {
  await loadPendingServers();
  await loadApprovedServers();
}

async function loadApprovedServers() {
  try {
    const response = await fetch(`${API_BASE}/servers`);
    if (response.ok) {
      const servers = await response.json();
      displayApprovedServers(servers);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des serveurs approuvés:', error);
  }
}

// === GESTION DES SERVEURS ===
async function loadServers() {
  await loadPendingServers();
  await loadApprovedServers();
}

async function loadApprovedServers() {
  try {
    const response = await fetch(`${API_BASE}/servers`);
    if (response.ok) {
      const servers = await response.json();
      displayServers(servers);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des serveurs approuvés:', error);
  }
}

async function loadSanctionsList() {
  try {
    const response = await fetch(`${API_BASE}/moderation/sanctions`);
    if (response.ok) {
      const sanctions = await response.json();
      
      // Appliquer les filtres
      const query = document.getElementById('sanctions-search')?.value || '';
      const filter = document.getElementById('sanctions-filter')?.value || '';
      
      let filtered = sanctions;
      
      // Filtre de recherche
      if (query) {
        filtered = filtered.filter(s => 
          s.targetUserId?.toLowerCase().includes(query.toLowerCase()) ||
          s.reason?.toLowerCase().includes(query.toLowerCase()) ||
          s.appliedBy?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Filtre de type/statut
      if (filter) {
        if (filter === 'active') {
          filtered = filtered.filter(s => s.active);
        } else if (filter === 'expired') {
          filtered = filtered.filter(s => !s.active);
        } else {
          filtered = filtered.filter(s => s.type === filter);
        }
      }
      
      displaySanctionsList(filtered);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des sanctions:', error);
  }
}

function displaySanctionsList(sanctions) {
  const list = document.getElementById('sanctions-list');
  if (!list) return;
  
  list.innerHTML = '';

  if (sanctions.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #64748b;">Aucune sanction trouvée</p>';
    return;
  }

  sanctions.forEach(sanction => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const typeLabels = {
      'avertissement_oral': '⚠️ Avertissement Oral',
      'avertissement_1': '⚠️ Avertissement 1',
      'avertissement_2': '⚠️ Avertissement 2',
      'ban_temp': '🚫 Ban Temporaire',
      'ban_perm': '🚫 Ban Permanent',
      'blacklist': '🚫 Blacklist'
    };
    
    const typeLabel = typeLabels[sanction.type] || sanction.type;
    const appliedDate = new Date(sanction.appliedAt).toLocaleDateString('fr-FR');
    const expiresDate = sanction.expiresAt ? new Date(sanction.expiresAt).toLocaleDateString('fr-FR') : 'Jamais';
    
    card.innerHTML = `
      <h3>${typeLabel}</h3>
      <p><strong>Utilisateur ID:</strong> ${sanction.targetUserId}</p>
      <p><strong>Raison:</strong> ${sanction.reason || 'Non spécifiée'}</p>
      <p><strong>Appliquée le:</strong> ${appliedDate}</p>
      <p><strong>Expire le:</strong> ${expiresDate}</p>
      <p><strong>Par:</strong> ${sanction.appliedBy}</p>
      <p><strong>Active:</strong> ${sanction.active ? 'Oui' : 'Non'}</p>
      <div class="action-buttons">
        <button class="btn-danger" onclick="deleteSanction('${sanction.id}')">🗑️ Supprimer</button>
      </div>
    `;
    list.appendChild(card);
  });
}

async function deleteSanction(sanctionId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette sanction ?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/moderation/sanctions/${sanctionId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('✅ Sanction supprimée');
      loadSanctionsList();
    } else {
      alert('❌ Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la suppression');
  }
}

async function loadBlacklist() {
  try {
    const response = await fetch(`${API_BASE}/moderation/blacklist`);
    if (response.ok) {
      const blacklisted = await response.json();
      
      // Appliquer la recherche
      const query = document.getElementById('blacklist-search')?.value || '';
      
      let filtered = blacklisted;
      if (query) {
        filtered = filtered.filter(u =>
          (u.username?.toLowerCase().includes(query.toLowerCase()) ||
           u.globalName?.toLowerCase().includes(query.toLowerCase()) ||
           u.discordId?.includes(query) ||
           u.id?.includes(query))
        );
      }
      
      displayBlacklist(filtered);
    }
  } catch (error) {
    console.error('Erreur lors du chargement de la blacklist:', error);
  }
}

async function loadSanctionsHistory() {
  try {
    const response = await fetch(`${API_BASE}/moderation/sanctions`);
    if (response.ok) {
      const sanctions = await response.json();
      
      // Appliquer les filtres
      const query = document.getElementById('history-search')?.value || '';
      const filter = document.getElementById('history-filter')?.value || '';
      
      let filtered = sanctions;
      
      // Filtre de recherche
      if (query) {
        filtered = filtered.filter(s => 
          s.targetUserId?.toLowerCase().includes(query.toLowerCase()) ||
          s.appliedBy?.toLowerCase().includes(query.toLowerCase()) ||
          s.reason?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Filtre de date
      if (filter) {
        const now = new Date();
        let days = 0;
        if (filter === 'last7days') days = 7;
        else if (filter === 'last30days') days = 30;
        else if (filter === 'last90days') days = 90;
        
        if (days > 0) {
          const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(s => new Date(s.appliedAt) >= cutoffDate);
        }
      }
      
      displaySanctionsHistory(filtered);
    }
  } catch (error) {
    console.error('Erreur lors du chargement de l\'historique des sanctions:', error);
  }
}

function displaySanctionsHistory(sanctions) {
  const list = document.getElementById('history-list');
  if (!list) return;
  
  list.innerHTML = '';

  if (sanctions.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #64748b;">Aucun historique trouvé</p>';
    return;
  }

  // Trier par date d'application (plus récent en premier)
  sanctions.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  sanctions.forEach(sanction => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const typeLabels = {
      'avertissement_oral': '⚠️ Avertissement Oral',
      'avertissement_1': '⚠️ Avertissement 1',
      'avertissement_2': '⚠️ Avertissement 2',
      'ban_temp': '🚫 Ban Temporaire',
      'ban_perm': '🚫 Ban Permanent',
      'blacklist': '🚫 Blacklist'
    };
    
    const typeLabel = typeLabels[sanction.type] || sanction.type;
    const appliedDate = new Date(sanction.appliedAt).toLocaleDateString('fr-FR');
    const expiresDate = sanction.expiresAt ? new Date(sanction.expiresAt).toLocaleDateString('fr-FR') : 'Jamais';
    
    card.innerHTML = `
      <h3>${typeLabel}</h3>
      <p><strong>Utilisateur ID:</strong> ${sanction.targetUserId}</p>
      <p><strong>Raison:</strong> ${sanction.reason || 'Non spécifiée'}</p>
      <p><strong>Appliquée le:</strong> ${appliedDate}</p>
      <p><strong>Expire le:</strong> ${expiresDate}</p>
      <p><strong>Par:</strong> ${sanction.appliedBy}</p>
      <p><strong>Statut:</strong> ${sanction.active ? 'Active' : 'Expirée'}</p>
    `;
    list.appendChild(card);
  });
}

// === ANNONCES ===
document.getElementById('announcement-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('announcement-title').value;
  const content = document.getElementById('announcement-content').value;
  const priority = document.getElementById('announcement-priority').value;

  try {
    const response = await fetch(`${API_BASE}/moderation/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, priority })
    });

    if (response.ok) {
      alert('✅ Annonce publiée avec succès!');
      e.target.reset();
    } else {
      alert('❌ Erreur lors de la publication');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la publication de l\'annonce');
  }
});

// === SERVEURS ===
async function loadPendingServers() {
  try {
    const response = await fetch(`${API_BASE}/servers/admin/pending`);
    if (response.ok) {
      const servers = await response.json();
      displayPendingServers(servers);
    }
  } catch (error) {
    console.error('Erreur lors du chargement des serveurs en attente:', error);
  }
}

function displayPendingServers(servers) {
  const list = document.getElementById('pending-servers-list');
  list.innerHTML = '';

  if (servers.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #92400e;">Aucun serveur en attente</p>';
    return;
  }

  servers.forEach(server => {
    const card = document.createElement('div');
    card.className = 'result-card';
    card.innerHTML = `
      <h3>⏳ ${server.name}</h3>
      <p><strong>ID:</strong> ${server.id}</p>
      <p><strong>Soumis par:</strong> ${server.submittedBy}</p>
      <p><strong>Lien d'invitation:</strong> <a href="${server.inviteLink}" target="_blank">${server.inviteLink}</a></p>
      <p><strong>Membres:</strong> ${server.memberCount || 0}</p>
      <p><strong>Description:</strong> ${server.description || 'N/A'}</p>
      <p><strong>Type:</strong> ${server.serverType || 'N/A'}</p>
      <p><strong>Tags:</strong> ${server.tags ? server.tags.join(', ') : 'N/A'}</p>
      <div class="action-buttons">
        <button class="btn-success" onclick="approveServer('${server.id}')">✅ Approuver</button>
        <button class="btn-danger" onclick="rejectServer('${server.id}')">❌ Rejeter</button>
      </div>
    `;
    list.appendChild(card);
  });
}

async function approveServer(serverId) {
  try {
    const response = await fetch(`${API_BASE}/servers/${serverId}/approve`, {
      method: 'POST'
    });

    if (response.ok) {
      alert('✅ Serveur approuvé avec succès');
      loadPendingServers();
    } else {
      const error = await response.json();
      alert(`❌ Erreur: ${error.message}`);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de l\'approbation');
  }
}

async function rejectServer(serverId) {
  const reason = prompt('Raison du rejet (optionnel):');
  
  try {
    const response = await fetch(`${API_BASE}/servers/${serverId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });

    if (response.ok) {
      alert('✅ Serveur rejeté');
      loadPendingServers();
    } else {
      const error = await response.json();
      alert(`❌ Erreur: ${error.message}`);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors du rejet');
  }
}

document.querySelector('#servers .btn-submit')?.addEventListener('click', async () => {
  const query = document.getElementById('servers-search').value;
  const suspended = document.getElementById('servers-filter').value;

  try {
    const params = new URLSearchParams({});
    if (query) params.append('query', query);
    if (suspended) params.append('suspended', suspended);

    const response = await fetch(`${API_BASE}/moderation/servers-search?${params}`);
    const servers = await response.json();
    displayServers(servers);
  } catch (error) {
    console.error('Erreur:', error);
  }
});

function displayServers(servers) {
  const list = document.getElementById('servers-list');
  list.innerHTML = '';

  if (servers.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #64748b;">Aucun serveur trouvé</p>';
    return;
  }

  servers.forEach(server => {
    const card = document.createElement('div');
    card.className = `result-card ${server.suspended ? 'suspended' : ''}`;
    const status = server.suspended ? '🚫 SUSPENDU' : '✅ ACTIF';
    card.innerHTML = `
      <h3>${server.name} ${status}</h3>
      <p><strong>ID:</strong> ${server.id}</p>
      <p><strong>Propriétaire:</strong> ${server.owner}</p>
      <p><strong>Membres:</strong> ${server.members || 0}</p>
      <p><strong>Description:</strong> ${server.description || 'N/A'}</p>
      ${server.suspended ? `<p><strong>Raison:</strong> ${server.suspensionReason}</p>` : ''}
      <div class="action-buttons">
        ${!server.suspended ? `<button class="btn-danger" onclick="suspendServer('${server.id}')">🚫 Suspendre</button>` : `<button class="btn-success" onclick="unsuspendServer('${server.id}')">✅ Rétablir</button>`}
        ${userRole === 'developer' ? `<button class="btn-danger" onclick="deleteServer('${server.id}')">🗑️ Supprimer</button>` : ''}
      </div>
    `;
    list.appendChild(card);
  });
}

async function suspendServer(serverId) {
  const reason = prompt('Raison de la suspension:');
  if (!reason) return;

  try {
    const response = await fetch(`${API_BASE}/moderation/suspend-server`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId, reason })
    });

    if (response.ok) {
      alert('✅ Serveur suspendu');
      document.querySelector('#servers .btn-submit').click();
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function unsuspendServer(serverId) {
  const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');

  try {
    const response = await fetch(`${API_BASE}/moderation/unsuspend-server`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serverId, userId })
    });

    if (response.ok) {
      alert('✅ Serveur rétabli');
      document.querySelector('#servers .btn-submit').click();
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

async function deleteServer(serverId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce serveur ? Cette action est irréversible.')) return;

  try {
    const response = await fetch(`${API_BASE}/servers/${serverId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('🗑️ Serveur supprimé avec succès');
      document.querySelector('#servers .btn-submit').click();
    } else {
      const error = await response.json();
      alert(`❌ Erreur: ${error.message}`);
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la suppression');
  }
}

// === AVIS ET COMMENTAIRES ===
async function loadReviewsList() {
  try {
    const response = await fetch(`${API_BASE}/reviews`);
    
    if (!response.ok) {
      console.error('Error loading reviews');
      return;
    }
    
    const allReviews = await response.json();
    
    // Appliquer les filtres
    const query = document.getElementById('reviews-search')?.value || '';
    const ratingFilter = document.getElementById('reviews-filter')?.value || '';
    
    let filtered = allReviews;
    
    if (query) {
      const queryLower = query.toLowerCase();
      filtered = filtered.filter(r =>
        r.serverId?.toLowerCase().includes(queryLower) ||
        r.username?.toLowerCase().includes(queryLower) ||
        r.comment?.toLowerCase().includes(queryLower)
      );
    }
    
    if (ratingFilter) {
      filtered = filtered.filter(r => r.rating === parseInt(ratingFilter));
    }
    
    displayReviewsList(filtered);
  } catch (error) {
    console.error('Erreur lors du chargement des avis:', error);
  }
}

function displayReviewsList(reviews) {
  const list = document.getElementById('reviews-list');
  if (!list) return;
  
  list.innerHTML = '';

  if (reviews.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #64748b;">Aucun avis trouvé</p>';
    return;
  }

  reviews.forEach(review => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const createdDate = new Date(review.createdAt).toLocaleDateString('fr-FR');
    
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="flex: 1;">
          <h3 style="margin: 0 0 0.5rem 0; color: #1e293b;">
            <span>${stars}</span>
            <span style="margin-left: 0.5rem;">Note: ${review.rating}/5</span>
          </h3>
          <p style="margin: 0.25rem 0; color: #64748b;"><strong>👤 Utilisateur:</strong> ${review.username || review.userId}</p>
          <p style="margin: 0.25rem 0; color: #64748b;"><strong>🖥️ Serveur ID:</strong> ${review.serverId}</p>
          <p style="margin: 0.25rem 0; color: #64748b;"><strong>📅 Date:</strong> ${createdDate}</p>
          <p style="margin: 0.75rem 0; color: #475569; padding: 1rem; background: #f1f5f9; border-radius: 8px; border-left: 3px solid #2563eb;">
            "${review.comment}"
          </p>
        </div>
      </div>
      <div class="action-buttons">
        <button class="btn-danger" onclick="deleteReview('${review.id}')">🗑️ Supprimer</button>
      </div>
    `;
    list.appendChild(card);
  });
}

async function deleteReview(reviewId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;
  
  try {
    const response = await fetch(`${API_BASE}/reviews/${reviewId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert('✅ Avis supprimé avec succès');
      loadReviewsList();
    } else {
      alert('❌ Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la suppression');
  }
}

// === SANCTIONS ===
document.getElementById('sanctions-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const targetUserId = document.getElementById('sanction-user-id').value;
  const type = document.getElementById('sanction-type').value;
  const duration = document.getElementById('sanction-duration').value ? parseInt(document.getElementById('sanction-duration').value) : null;
  const reason = document.getElementById('sanction-reason').value;

  try {
    const response = await fetch(`${API_BASE}/moderation/sanctions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, type, duration, reason })
    });

    if (response.ok) {
      alert('✅ Sanction appliquée!');
      e.target.reset();
    } else {
      alert('❌ Erreur lors de l\'application de la sanction');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
});

// === TICKETS ===
async function loadTickets() {
  try {
    const response = await fetch(`/api/tickets/admin/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load tickets');
    }

    const tickets = await response.json();
    displayTickets(tickets);
  } catch (error) {
    console.error('Erreur:', error);
    document.getElementById('tickets-list').innerHTML = '<p style="text-align: center; color: #991b1b;">Erreur lors du chargement des tickets</p>';
  }
}

function displayTickets(tickets) {
  const list = document.getElementById('tickets-list');
  list.innerHTML = '';

  if (tickets.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #64748b;">✅ Aucun ticket en attente</p>';
    return;
  }

  const sortedTickets = tickets.sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
    const statusOrder = { open: 0, 'in-progress': 1, resolved: 2, closed: 3 };
    
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return statusOrder[a.status] - statusOrder[b.status];
  });

  sortedTickets.forEach(ticket => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const createdDate = new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

    const statusBadges = {
      'open': '<span class="ticket-badge badge-status open">🟡 Ouvert</span>',
      'in-progress': '<span class="ticket-badge badge-status in-progress">🔵 En cours</span>',
      'resolved': '<span class="ticket-badge badge-status resolved">🟢 Résolu</span>',
      'closed': '<span class="ticket-badge badge-status closed">⚫ Fermé</span>'
    };

    const priorityBadges = {
      'low': '<span class="ticket-badge badge-priority low">⬇️ Basse</span>',
      'normal': '<span class="ticket-badge badge-priority normal">➡️ Normal</span>',
      'high': '<span class="ticket-badge badge-priority high">⬆️ Haute</span>',
      'urgent': '<span class="ticket-badge badge-priority urgent">🔴 Urgent</span>'
    };

    const responseCount = (ticket.responses || []).length;

    card.innerHTML = `
      <h3>🎫 ${ticket.subject}</h3>
      <div style="margin-bottom: 1rem; display: flex; gap: 0.5rem;">
        ${statusBadges[ticket.status] || '<span class="ticket-badge">❓ Inconnu</span>'}
        ${priorityBadges[ticket.priority] || '<span class="ticket-badge">❓ Inconnu</span>'}
      </div>
      <p><strong>ID:</strong> #${ticket.id.substring(0, 8)}</p>
      <p><strong>Auteur:</strong> ${ticket.username || 'Inconnu'}</p>
      <p><strong>Créé le:</strong> ${createdDate}</p>
      <p><strong>Catégorie:</strong> ${ticket.category}</p>
      <p><strong>Réponses:</strong> ${responseCount}</p>
      <p style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 0.95rem;">${ticket.message}</p>
      <div class="action-buttons">
        <button class="btn-submit" onclick="openTicketDetail('${ticket.id}'); return false;" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">👁️ Voir le détail</button>
        ${ticket.status !== 'in-progress' ? `<button class="btn-submit" onclick="updateTicketStatus('${ticket.id}', 'in-progress'); return false;" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">▶️ Marquer En cours</button>` : ''}
        ${ticket.status !== 'resolved' ? `<button class="btn-submit" onclick="updateTicketStatus('${ticket.id}', 'resolved'); return false;" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">✅ Marquer Résolu</button>` : ''}
        <button class="btn-submit" onclick="deleteTicket('${ticket.id}', '${ticket.subject.replace(/'/g, "\\'")}'); return false;" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">🗑️ Supprimer</button>
      </div>
    `;
    list.appendChild(card);
  });
}

async function updateTicketStatus(ticketId, newStatus) {
  try {
    const response = await fetch(`/api/tickets/${ticketId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    if (!response.ok) {
      throw new Error('Failed to update ticket');
    }

    alert('✅ Statut du ticket mis à jour');
    loadTickets();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la mise à jour');
  }
}

async function deleteTicket(ticketId, ticketSubject) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le ticket "${ticketSubject}"?\n\nCette action est irréversible.`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to delete ticket');
    }

    alert('✅ Ticket supprimé avec succès');
    loadTickets();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la suppression du ticket');
  }
}

async function openTicketResponse(ticketId, ticketSubject) {
  const message = prompt(`Répondre au ticket: "${ticketSubject}"\n\nVotre réponse:`);
  if (!message) return;

  try {
    const response = await fetch(`/api/tickets/${ticketId}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error('Failed to add response');
    }

    alert('✅ Réponse envoyée avec succès');
    loadTickets();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de l\'envoi de la réponse');
  }
}

// Fonction pour afficher les détails d'un ticket avec réponses
async function openTicketDetail(ticketId) {
  try {
    const response = await fetch(`/api/tickets/${ticketId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to load ticket');
    }

    const ticket = await response.json();
    showTicketModal(ticket);
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors du chargement du ticket');
  }
}

// Afficher un modal avec les détails du ticket et réponses
function showTicketModal(ticket) {
  const responses = ticket.responses || [];
  const responsesHTML = responses.map(r => `
    <div style="background: ${r.isAdmin ? '#dbeafe' : '#f8fafc'}; border: 1px solid ${r.isAdmin ? '#0369a1' : '#e2e8f0'}; border-radius: 10px; padding: 1rem; margin-bottom: 1rem; margin-top: 1rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
        <strong style="color: #1e293b;">${r.username}</strong>
        <div>
          ${r.isAdmin ? '<span style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600; margin-right: 0.5rem;">👨‍💼 ÉQUIPE</span>' : ''}
          <span style="font-size: 0.85rem; color: #64748b;">${new Date(r.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      <p style="color: #1e293b; margin: 0; white-space: pre-wrap; word-break: break-word;">${r.message}</p>
    </div>
  `).join('');

  const modal = document.createElement('div');
  modal.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; overflow: auto;';
  modal.id = 'ticket-detail-modal';
  
  modal.innerHTML = `
    <div style="background: white; border-radius: 16px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15); padding: 2rem;">
      <button onclick="document.getElementById('ticket-detail-modal').remove()" style="position: absolute; top: 1.5rem; right: 1.5rem; background: none; border: none; font-size: 2rem; color: #64748b; cursor: pointer; transition: color 0.2s; padding: 0; hover: color #1e293b;">&times;</button>
      
      <h2 style="color: #1e293b; margin: 0 0 1rem 0; padding-right: 2rem;">${ticket.subject}</h2>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
        <div style="color: #64748b;"><strong style="color: #1e293b; display: block; margin-bottom: 0.3rem;">ID</strong>#${ticket.id.substring(0, 8)}</div>
        <div style="color: #64748b;"><strong style="color: #1e293b; display: block; margin-bottom: 0.3rem;">Statut</strong>${ticket.status}</div>
        <div style="color: #64748b;"><strong style="color: #1e293b; display: block; margin-bottom: 0.3rem;">Priorité</strong>${ticket.priority}</div>
        <div style="color: #64748b;"><strong style="color: #1e293b; display: block; margin-bottom: 0.3rem;">Créé le</strong>${new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</div>
      </div>
      
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem; color: #1e293b; white-space: pre-wrap; word-break: break-word;">${ticket.message}</div>
      
      <div style="border-top: 2px solid #e2e8f0; padding-top: 1.5rem;">
        <h3 style="color: #1e293b; margin: 0 0 1rem 0;">Réponses (${responses.length})</h3>
        ${responsesHTML}
        
        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #e2e8f0;">
          <h3 style="color: #1e293b; margin: 0 0 1rem 0;">Ajouter une réponse</h3>
          <textarea id="modal-response-message" placeholder="Votre message..." style="width: 100%; padding: 1rem; border: 2px solid #cbd5e1; border-radius: 10px; font-family: inherit; font-size: 1rem; color: #1e293b; min-height: 100px; resize: vertical; transition: all 0.3s ease; box-sizing: border-box;"></textarea>
          <button onclick="addResponseFromModal('${ticket.id}')" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 0.8rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 1rem; transition: all 0.3s ease; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">Envoyer la réponse</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// Ajouter une réponse depuis le modal
async function addResponseFromModal(ticketId) {
  const message = document.getElementById('modal-response-message')?.value.trim();
  if (!message) {
    alert('Veuillez écrire un message');
    return;
  }

  try {
    const response = await fetch(`/api/tickets/${ticketId}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error('Failed to add response');
    }

    // Fermer le modal et recharger les tickets
    document.getElementById('ticket-detail-modal')?.remove();
    alert('✅ Réponse envoyée avec succès');
    loadTickets();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de l\'envoi de la réponse');
  }
}

// === PARTENAIRES ===
async function loadPartners() {
  try {
    const response = await fetch(`${API_BASE}/partners`);
    if (!response.ok) {
      throw new Error('Failed to load partners');
    }

    const partners = await response.json();
    displayPartners(partners);
  } catch (error) {
    console.error('Erreur:', error);
    document.getElementById('partners-list').innerHTML = '<p style="text-align: center; color: #991b1b;">Erreur lors du chargement des partenaires</p>';
  }
}

function displayPartners(partners) {
  const list = document.getElementById('partners-list');
  list.innerHTML = '';

  if (partners.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #64748b;">✅ Aucun partenaire pour le moment</p>';
    return;
  }

  partners.forEach(partner => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1rem;">
        <img src="${partner.image}" alt="${partner.name}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover;">
        <div style="flex: 1;">
          <h3 style="margin: 0; color: #1e293b;">${partner.name}</h3>
          <p style="margin: 0.5rem 0 0; color: #64748b; font-size: 0.95rem;">${partner.description}</p>
          <p style="margin: 0.5rem 0 0; color: #2563eb; font-size: 0.9rem;">🔗 ${partner.externalLink || 'Aucun lien'}</p>
        </div>
      </div>
      <div class="action-buttons">
        <button class="btn-submit" onclick="editPartner('${partner.id}', '${partner.name.replace(/'/g, "\\'")}'); return false;" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);">✏️ Modifier</button>
        <button class="btn-submit" onclick="deletePartner('${partner.id}', '${partner.name.replace(/'/g, "\\'")}'); return false;" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">🗑️ Supprimer</button>
      </div>
    `;
    list.appendChild(card);
  });
}

async function deletePartner(partnerId, partnerName) {
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le partenaire "${partnerName}"?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/partners/${partnerId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Failed to delete partner');
    }

    alert('✅ Partenaire supprimé avec succès');
    loadPartners();
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la suppression du partenaire');
  }
}

function editPartner(partnerId, partnerName) {
  // Charger les partenaires pour obtenir l'objet complet
  fetch(`${API_BASE}/partners`)
    .then(res => res.json())
    .then(partners => {
      const partner = partners.find(p => p.id === partnerId);
      if (!partner) {
        alert('❌ Partenaire non trouvé');
        return;
      }

      // Remplir le formulaire avec les données existantes
      document.getElementById('partner-name').value = partner.name;
      document.getElementById('partner-description').value = partner.description;
      document.getElementById('partner-image-url').value = partner.image || '';
      document.getElementById('partner-external-link').value = partner.externalLink || '';
      document.getElementById('partner-image').value = '';

      // Changer le bouton de submit
      const btn = document.querySelector('#partner-form button[type="submit"]');
      const originalText = btn.textContent;
      btn.textContent = '💾 Modifier le partenaire';
      btn.dataset.editing = 'true';
      btn.dataset.partnerId = partnerId;

      // Scroll vers le formulaire
      document.querySelector('#partner-form').scrollIntoView({ behavior: 'smooth' });

      // Ajouter un bouton d'annulation
      if (!document.getElementById('cancel-edit-btn')) {
        const cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancel-edit-btn';
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-submit';
        cancelBtn.style.background = 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
        cancelBtn.textContent = '✖️ Annuler';
        cancelBtn.onclick = cancelEditPartner;
        document.querySelector('#partner-form').appendChild(cancelBtn);
      }
    })
    .catch(error => {
      console.error('Erreur:', error);
      alert('❌ Erreur lors du chargement du partenaire');
    });
}

function cancelEditPartner() {
  const btn = document.querySelector('#partner-form button[type="submit"]');
  btn.textContent = '➕ Ajouter le partenaire';
  btn.dataset.editing = 'false';
  btn.dataset.partnerId = '';
  document.getElementById('partner-form').reset();
  
  const cancelBtn = document.getElementById('cancel-edit-btn');
  if (cancelBtn) cancelBtn.remove();
}

document.getElementById('partner-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('partner-name').value.trim();
  const description = document.getElementById('partner-description').value.trim();
  const externalLink = document.getElementById('partner-external-link').value.trim();
  const imageFile = document.getElementById('partner-image').files[0];
  const imageUrl = document.getElementById('partner-image-url').value.trim();

  if (!name || !description || !externalLink) {
    alert('❌ Le nom, la description et le lien externe sont obligatoires');
    return;
  }

  // Valider l'URL du lien externe
  try {
    new URL(externalLink);
  } catch (error) {
    alert('❌ Le lien externe doit être une URL valide');
    return;
  }

  if (!imageFile && !imageUrl) {
    alert('❌ Veuillez fournir une image (upload ou URL)');
    return;
  }

  let imagePath = imageUrl;

  // If file is selected, upload it
  if (imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const uploadResponse = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });

      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        imagePath = uploadData.path;
      } else {
        // Fallback: use a data URL for the image
        imagePath = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target.result);
          reader.readAsDataURL(imageFile);
        });
      }
    } catch (error) {
      console.warn('Upload failed, using local image:', error);
      imagePath = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.readAsDataURL(imageFile);
      });
    }
  }

  try {
    const btn = document.querySelector('#partner-form button[type="submit"]');
    const isEditing = btn.dataset.editing === 'true';
    const partnerId = btn.dataset.partnerId;

    let response;
    if (isEditing) {
      // Modifier un partenaire existant
      response = await fetch(`${API_BASE}/partners/${partnerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          image: imagePath,
          externalLink
        })
      });
    } else {
      // Créer un nouveau partenaire
      response = await fetch(`${API_BASE}/partners`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          image: imagePath,
          externalLink
        })
      });
    }

    if (response.ok) {
      alert(isEditing ? '✅ Partenaire modifié avec succès!' : '✅ Partenaire ajouté avec succès!');
      e.target.reset();
      
      // Réinitialiser le bouton si on était en modification
      if (isEditing) {
        btn.textContent = '➕ Ajouter le partenaire';
        btn.dataset.editing = 'false';
        btn.dataset.partnerId = '';
        const cancelBtn = document.getElementById('cancel-edit-btn');
        if (cancelBtn) cancelBtn.remove();
      }
      
      loadPartners();
    } else {
      alert('❌ Erreur lors de la sauvegarde du partenaire');
    }
  } catch (error) {
    console.error('Erreur:', error);
    alert('❌ Erreur lors de la sauvegarde du partenaire');
  }
});

// Charger les données initiales
async function loadInitialData() {
  // Charger les tickets pour admin, moderateur et developer
  if (['admin', 'moderator', 'developer'].includes(userRole)) {
    loadTickets();
  }
  
  // Charger les partenaires pour developer
  if (userRole === 'developer') {
    loadPartners();
  }
}

// Déconnexion
document.getElementById('logout-link')?.addEventListener('click', (e) => {
  e.preventDefault();
  fetch(`${API_BASE}/auth/logout`, { method: 'POST' })
    .then(() => {
      window.location.href = 'login.html';
    });
});

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

// === GESTION DU PERSONNEL ===
async function loadPersonnel() {
  try {
    const response = await fetch(`${API_BASE}/users`);
    if (response.ok) {
      const users = await response.json();
      
      // Appliquer les filtres
      const query = document.getElementById('personnel-search')?.value || '';
      const filter = document.getElementById('personnel-filter')?.value || '';
      
      let filtered = users;
      
      // Filtre de recherche
      if (query) {
        filtered = filtered.filter(u => 
          u.username?.toLowerCase().includes(query.toLowerCase()) ||
          u.id?.toLowerCase().includes(query.toLowerCase()) ||
          u.globalName?.toLowerCase().includes(query.toLowerCase())
        );
      }
      
      // Filtre de rôle
      if (filter) {
        filtered = filtered.filter(u => u.role === filter);
      }
      
      displayPersonnelList(filtered);
    } else {
      console.error('Erreur lors du chargement du personnel:', response.status);
    }
  } catch (error) {
    console.error('Erreur lors du chargement du personnel:', error);
  }
}

function displayPersonnelList(users) {
  const list = document.getElementById('personnel-list');
  if (!list) return;
  
  list.innerHTML = '';

  if (users.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: #64748b;">Aucun utilisateur trouvé</p>';
    return;
  }

  users.forEach(user => {
    const card = document.createElement('div');
    card.className = 'result-card';
    
    const roleLabels = {
      'developer': 'Développeur',
      'admin': 'Admin',
      'moderator': 'Modérateur',
      'user': 'Utilisateur'
    };
    
    const roleLabel = roleLabels[user.role] || user.role;
    const joinDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'Inconnue';
    
    let roleOptions = '';
    if (userRole === 'developer') {
      roleOptions = `
        <option value="">Changer le rôle...</option>
        <option value="user">Utilisateur</option>
        <option value="moderator">Modérateur</option>
        <option value="admin">Admin</option>
        <option value="developer">Développeur</option>
      `;
    } else if (userRole === 'admin') {
      roleOptions = `
        <option value="">Changer le rôle...</option>
        <option value="user">Utilisateur</option>
        <option value="moderator">Modérateur</option>
      `;
    }
    
    card.innerHTML = `
      <h3>${user.globalName || user.username}</h3>
      <p><strong>ID Discord:</strong> ${user.id || user.discordId}</p>
      <p><strong>Rôle actuel:</strong> <span class="role-badge ${user.role}">${roleLabel.toUpperCase()}</span></p>
      <p><strong>Inscrit le:</strong> ${joinDate}</p>
      <div class="action-buttons">
        <select id="role-select-${user.id}" onchange="changeUserRole('${user.id}', this.value)">
          ${roleOptions}
        </select>
      </div>
    `;
    
    list.appendChild(card);
  });
}

async function changeUserRole(userId, newRole) {
  if (!newRole) return;
  
  try {
    const response = await fetch(`${API_BASE}/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: newRole })
    });
    
    if (response.ok) {
      alert('Rôle mis à jour avec succès!');
      loadPersonnel(); // Recharger la liste
    } else {
      const error = await response.json();
      alert('Erreur: ' + (error.message || 'Impossible de changer le rôle'));
    }
  } catch (error) {
    console.error('Erreur lors du changement de rôle:', error);
    alert('Erreur lors du changement de rôle');
  }
}

// Charger au démarrage
loadUserInfo();
