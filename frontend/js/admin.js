// admin.js

document.addEventListener('DOMContentLoaded', () => {
  checkAdmin();
  loadAdminContent();
  document.getElementById('logout-link').addEventListener('click', logout);
});

async function checkAdmin() {
  try {
    const response = await fetch('/api/auth/me');
    if (response.ok) {
      const user = await response.json();
      if (!['admin', 'moderator', 'developer'].includes(user.role)) {
        window.location.href = 'index.html';
      }
    } else {
      window.location.href = 'login.html';
    }
  } catch (error) {
    window.location.href = 'login.html';
  }
}

async function loadAdminContent() {
  const content = document.getElementById('admin-content');
  const userResponse = await fetch('/api/auth/me');
  const user = await userResponse.json();
  
  let html = '<h3>Serveurs en attente</h3><div id="pending-servers"></div>';
  
  if (user.role === 'moderator' || user.role === 'admin' || user.role === 'developer') {
    html += '<h3>Tous les tickets</h3><div id="tickets"></div>';
  }
  
  if (user.role === 'admin' || user.role === 'developer') {
    html += '<h3>Gérer les serveurs</h3><div id="all-servers"></div>';
    html += '<h3>Gérer les utilisateurs</h3><input type="text" id="user-search" placeholder="Rechercher utilisateur..."><div id="all-users"></div>';
  }
  
  if (user.role === 'developer') {
    html += '<h3>Annonces</h3><div id="announcements-admin"></div>';
  }
  
  content.innerHTML = html;
  
  loadPendingServers();
  if (user.role === 'moderator' || user.role === 'admin' || user.role === 'developer') {
    loadTickets();
  }
  if (user.role === 'admin' || user.role === 'developer') {
    loadAllServers();
    loadAllUsers();
    document.getElementById('user-search').addEventListener('input', filterUsers);
  }
  if (user.role === 'developer') {
    loadAnnouncementsAdmin();
  }
}

async function loadPendingServers() {
  try {
    const response = await fetch('/api/servers/admin/pending');
    const servers = await response.json();
    const container = document.getElementById('pending-servers');
    container.innerHTML = '';
    servers.forEach(server => {
      const div = document.createElement('div');
      div.className = 'server-card';
      div.innerHTML = `
        <h4>${server.name}</h4>
        <p>${server.description}</p>
        <button class="btn" onclick="approveServer('${server.id}')">Approuver</button>
        <button class="btn btn-danger" onclick="rejectServer('${server.id}')">Rejeter</button>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading pending servers:', error);
  }
}

async function loadAllServers() {
  try {
    const response = await fetch('/api/servers');
    const servers = await response.json();
    const container = document.getElementById('all-servers');
    container.innerHTML = '';
    servers.forEach(server => {
      const div = document.createElement('div');
      div.className = 'server-card';
      div.innerHTML = `
        <h4>${server.name}</h4>
        <p>Statut: ${server.status} | Suspendu: ${server.suspended ? 'Oui' : 'Non'}</p>
        <button class="btn" onclick="editServer('${server.id}')">Modifier</button>
        <button class="btn btn-danger" onclick="deleteServer('${server.id}')">Supprimer</button>
        ${server.suspended ? `<button class="btn" onclick="unsuspendServer('${server.id}')">Désuspendre</button>` : `<button class="btn btn-danger" onclick="suspendServer('${server.id}')">Suspendre</button>`}
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading all servers:', error);
  }
}

async function loadAllUsers() {
  try {
    const response = await fetch('/api/users');
    const users = await response.json();
    const container = document.getElementById('all-users');
    container.innerHTML = '';
    users.forEach(user => {
      const div = document.createElement('div');
      div.className = 'server-card';
      div.innerHTML = `
        <h4>${user.username}</h4>
        <p>Rôle: ${user.role} | Blacklisté: ${user.blacklisted ? 'Oui' : 'Non'}</p>
        <button class="btn" onclick="changeUserRole('${user.id}', '${user.role}')">Changer rôle</button>
        ${user.blacklisted ? `<button class="btn" onclick="unblacklistUser('${user.id}')">Déblacklister</button>` : `<button class="btn btn-danger" onclick="blacklistUser('${user.id}')">Blacklister</button>`}
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading all users:', error);
  }
}

function filterUsers() {
  const searchTerm = document.getElementById('user-search').value.toLowerCase();
  const userCards = document.querySelectorAll('#all-users .server-card');
  userCards.forEach(card => {
    const username = card.querySelector('h4').textContent.toLowerCase();
    if (username.includes(searchTerm)) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

async function loadAnnouncementsAdmin() {
  try {
    const response = await fetch('/api/announcements/all');
    const announcements = await response.json();
    const container = document.getElementById('announcements-admin');
    container.innerHTML = '<button class="btn" onclick="createAnnouncement()">Créer annonce</button>';
    announcements.forEach(announcement => {
      const div = document.createElement('div');
      div.className = 'server-card';
      div.innerHTML = `
        <h4>${announcement.title}</h4>
        <p>${announcement.message}</p>
        <p>Actif: ${announcement.active ? 'Oui' : 'Non'}</p>
        <button class="btn" onclick="editAnnouncement('${announcement.id}')">Modifier</button>
        <button class="btn btn-danger" onclick="deleteAnnouncement('${announcement.id}')">Supprimer</button>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading announcements:', error);
  }
}

async function loadTickets() {
  try {
    const response = await fetch('/api/tickets/admin/all');
    const tickets = await response.json();
    const container = document.getElementById('tickets');
    container.innerHTML = '';
    tickets.forEach(ticket => {
      const div = document.createElement('div');
      div.className = 'server-card';
      div.innerHTML = `
        <h4>${ticket.subject}</h4>
        <p><strong>Utilisateur:</strong> ${ticket.userId}</p>
        <p>${ticket.message}</p>
        <p><strong>Statut:</strong> ${ticket.status}</p>
        ${ticket.response ? `<p><strong>Réponse:</strong> ${ticket.response}</p>` : ''}
        ${ticket.status === 'open' ? `<textarea id="response-${ticket.id}" placeholder="Réponse"></textarea><button class="btn" onclick="replyTicket('${ticket.id}')">Répondre</button>` : ''}
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading tickets:', error);
  }
}

async function approveServer(id) {
  try {
    const response = await fetch(`/api/servers/${id}/approve`, { method: 'POST' });
    if (response.ok) {
      loadPendingServers();
    } else {
      alert('Erreur lors de l\'approbation');
    }
  } catch (error) {
    console.error('Error approving server:', error);
    alert('Erreur réseau');
  }
}

async function rejectServer(id) {
  try {
    const response = await fetch(`/api/servers/${id}/reject`, { method: 'POST' });
    if (response.ok) {
      loadPendingServers();
    } else {
      alert('Erreur lors du rejet');
    }
  } catch (error) {
    console.error('Error rejecting server:', error);
    alert('Erreur réseau');
  }
}

async function suspendServer(id) {
  try {
    const response = await fetch(`/api/servers/${id}/suspend`, { method: 'POST' });
    if (response.ok) {
      loadAllServers();
    } else {
      alert('Erreur lors de la suspension');
    }
  } catch (error) {
    console.error('Error suspending server:', error);
    alert('Erreur réseau');
  }
}

async function unsuspendServer(id) {
  try {
    const response = await fetch(`/api/servers/${id}/unsuspend`, { method: 'POST' });
    if (response.ok) {
      loadAllServers();
    } else {
      alert('Erreur lors de la désuspension');
    }
  } catch (error) {
    console.error('Error unsuspending server:', error);
    alert('Erreur réseau');
  }
}

async function deleteServer(id) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce serveur ?')) {
    try {
      const response = await fetch(`/api/servers/${id}`, { method: 'DELETE' });
      if (response.ok) {
        loadAllServers();
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Erreur réseau');
    }
  }
}

async function blacklistUser(id) {
  try {
    const response = await fetch(`/api/users/${id}/blacklist`, { method: 'POST' });
    if (response.ok) {
      loadAllUsers();
    } else {
      alert('Erreur lors du blacklistage');
    }
  } catch (error) {
    console.error('Error blacklisting user:', error);
    alert('Erreur réseau');
  }
}

async function unblacklistUser(id) {
  try {
    const response = await fetch(`/api/users/${id}/unblacklist`, { method: 'POST' });
    if (response.ok) {
      loadAllUsers();
    } else {
      alert('Erreur lors du déblacklistage');
    }
  } catch (error) {
    console.error('Error unblacklisting user:', error);
    alert('Erreur réseau');
  }
}

async function replyTicket(id) {
  const responseText = document.getElementById(`response-${id}`).value;
  if (!responseText.trim()) {
    alert('Veuillez entrer une réponse');
    return;
  }
  try {
    const response = await fetch(`/api/tickets/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response: responseText })
    });
    if (response.ok) {
      loadTickets();
    } else {
      alert('Erreur lors de la réponse au ticket');
    }
  } catch (error) {
    console.error('Error replying to ticket:', error);
    alert('Erreur réseau');
  }
}

function createAnnouncement() {
  const title = prompt('Titre de l\'annonce:');
  const message = prompt('Message de l\'annonce:');
  if (title && message) {
    fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message })
    }).then(() => loadAnnouncementsAdmin());
  }
}

function editAnnouncement(id) {
  const title = prompt('Nouveau titre:');
  const message = prompt('Nouveau message:');
  if (title && message) {
    fetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, message })
    }).then(() => loadAnnouncementsAdmin());
  }
}

function deleteAnnouncement(id) {
  if (confirm('Supprimer cette annonce ?')) {
    fetch(`/api/announcements/${id}`, { method: 'DELETE' })
      .then(() => loadAnnouncementsAdmin());
  }
}

function editServer(id) {
  const name = prompt('Nouveau nom:');
  const description = prompt('Nouvelle description:');
  if (name && description) {
    fetch(`/api/servers/admin/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    }).then(() => loadAllServers());
  }
}

async function changeUserRole(id, currentRole) {
  const roles = ['user', 'moderator', 'admin', 'developer'];
  const newRole = prompt(`Nouveau rôle pour cet utilisateur (${roles.join(', ')}):`, currentRole);
  if (newRole && roles.includes(newRole)) {
    try {
      const response = await fetch(`/api/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      if (response.ok) {
        loadAllUsers();
      } else {
        alert('Erreur lors du changement de rôle');
      }
    } catch (error) {
      console.error('Error changing user role:', error);
      alert('Erreur réseau');
    }
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