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
    html += '<h3>Appels de suspension</h3><div id="appeals"></div>';
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
    loadAppeals();
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
    console.log('Loading pending servers...');
    const response = await fetch('/api/servers/admin/pending');
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.error('Error loading pending servers:', response.statusText);
      const container = document.getElementById('pending-servers');
      container.innerHTML = `<p style="color: #d32f2f; text-align: center;">Erreur: ${response.status} ${response.statusText}</p>`;
      return;
    }
    
    const servers = await response.json();
    console.log('Pending servers:', servers);
    const container = document.getElementById('pending-servers');
    container.innerHTML = '';
    
    if (servers.length === 0) {
      container.innerHTML = '<p style="color: #888; text-align: center;">Aucun serveur en attente</p>';
      return;
    }
    
    servers.forEach(server => {
      const div = document.createElement('div');
      div.className = 'server-card';
      const submittedDate = new Date(server.submittedAt || Date.now()).toLocaleString('fr-FR');
      
      div.innerHTML = `
        <div style="margin-bottom: 1rem;">
          <h4 style="margin: 0 0 0.5rem 0; color: #1e293b;">${server.name}</h4>
          <p style="margin: 0 0 0.5rem 0; color: #64748b; font-size: 0.95rem;">${server.description || 'Pas de description'}</p>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem;">
            ${server.tags && server.tags.length > 0 ? server.tags.slice(0, 3).map(tag => `<span style="background: #e2e8f0; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem;">${tag}</span>`).join('') : '<span style="color: #999;">Pas de tags</span>'}
          </div>
          <div style="color: #888; font-size: 0.9rem;">
            <p style="margin: 0.25rem 0;">📅 Soumis: ${submittedDate}</p>
            <p style="margin: 0.25rem 0;">👥 Membres: ${server.memberCount}</p>
            <p style="margin: 0.25rem 0;">⚡ Activité: ${server.activityLevel}</p>
            <p style="margin: 0.25rem 0;">🔗 <a href="${server.inviteLink}" target="_blank" style="color: #2563eb;">Lien d'invitation</a></p>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary" onclick="approveServer('${server.id}')">✓ Approuver</button>
          <button class="btn btn-danger" onclick="rejectServer('${server.id}')">✗ Rejeter</button>
        </div>
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading pending servers:', error);
    document.getElementById('pending-servers').innerHTML = '<p style="color: #f00;">Erreur lors du chargement</p>';
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
  if (!confirm('Êtes-vous sûr de vouloir approuver ce serveur?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/servers/${id}/approve`, { method: 'POST' });
    if (response.ok) {
      alert('Serveur approuvé avec succès!');
      loadPendingServers();
    } else {
      const error = await response.json();
      alert(`Erreur lors de l'approbation: ${error.message || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.error('Error approving server:', error);
    alert('Erreur réseau lors de l\'approbation');
  }
}

async function rejectServer(id) {
  const reason = prompt('Raison du rejet (optionnel):');
  if (reason === null) {
    return; // User clicked cancel
  }
  
  try {
    const response = await fetch(`/api/servers/${id}/reject`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason })
    });
    if (response.ok) {
      alert('Serveur rejeté');
      loadPendingServers();
    } else {
      const error = await response.json();
      alert(`Erreur lors du rejet: ${error.message || 'Erreur inconnue'}`);
    }
  } catch (error) {
    console.error('Error rejecting server:', error);
    alert('Erreur réseau lors du rejet');
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

// === APPEALS MANAGEMENT ===

async function loadAppeals() {
  try {
    const response = await fetch('/api/appeals');
    const appeals = await response.json();
    const container = document.getElementById('appeals');
    container.innerHTML = '';

    // Separate pending and resolved appeals
    const pending = appeals.filter(a => a.status === 'pending');
    const resolved = appeals.filter(a => a.status !== 'pending');

    if (pending.length === 0 && resolved.length === 0) {
      container.innerHTML = '<p>Aucun appel</p>';
      return;
    }

    // Show pending appeals first
    if (pending.length > 0) {
      container.innerHTML += '<h4 style="color: #ff6b6b;">⏳ Appels en attente</h4>';
      pending.forEach(appeal => {
        const div = document.createElement('div');
        div.className = 'appeal-card';
        div.innerHTML = `
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
            <h5>${appeal.serverName}</h5>
            <p><strong>Soumis par:</strong> ${appeal.submittedByName}</p>
            <p><strong>Date:</strong> ${new Date(appeal.submittedAt).toLocaleString('fr-FR')}</p>
            <div style="background: white; padding: 1rem; border-radius: 6px; margin: 1rem 0; border-left: 4px solid #2563eb;">
              <p><strong>Explication:</strong></p>
              <p>${appeal.explanation}</p>
            </div>
            <div style="display: flex; gap: 1rem;">
              <button class="btn btn-primary" onclick="acceptAppeal('${appeal.id}')">✓ Accepter</button>
              <button class="btn btn-danger" onclick="refuseAppeal('${appeal.id}')">✗ Refuser</button>
            </div>
          </div>
        `;
        container.appendChild(div);
      });
    }

    // Show resolved appeals
    if (resolved.length > 0) {
      container.innerHTML += '<h4 style="color: #888;">📋 Appels résolus</h4>';
      resolved.forEach(appeal => {
        const div = document.createElement('div');
        div.className = 'appeal-card';
        const statusColor = appeal.status === 'accepted' ? '#51cf66' : '#ff6b6b';
        const statusText = appeal.status === 'accepted' ? '✓ Accepté' : '✗ Refusé';
        div.innerHTML = `
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; opacity: 0.7;">
            <h5>${appeal.serverName} - <span style="color: ${statusColor};">${statusText}</span></h5>
            <p><strong>Soumis par:</strong> ${appeal.submittedByName}</p>
            <p><strong>Examiné par:</strong> ${appeal.reviewedByName || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date(appeal.submittedAt).toLocaleString('fr-FR')}</p>
          </div>
        `;
        container.appendChild(div);
      });
    }
  } catch (error) {
    console.error('Error loading appeals:', error);
  }
}

async function acceptAppeal(appealId) {
  if (!confirm('Êtes-vous sûr de vouloir accepter cet appel? Le serveur sera désuspendu.')) {
    return;
  }

  try {
    const response = await fetch(`/api/appeals/${appealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'accepted',
        decisionReason: 'Appeal accepted by moderator'
      })
    });

    if (response.ok) {
      alert('Appel accepté. Le serveur a été désuspendu.');
      loadAppeals();
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.error}`);
    }
  } catch (error) {
    console.error('Error accepting appeal:', error);
    alert('Erreur lors de l\'acceptation de l\'appel');
  }
}

async function refuseAppeal(appealId) {
  const reason = prompt('Raison du refus (optionnel):');
  if (reason === null) {
    return;
  }

  try {
    const response = await fetch(`/api/appeals/${appealId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'refused',
        decisionReason: reason || 'Appeal refused by moderator'
      })
    });

    if (response.ok) {
      alert('Appel refusé.');
      loadAppeals();
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.error}`);
    }
  } catch (error) {
    console.error('Error refusing appeal:', error);
    alert('Erreur lors du refus de l\'appel');
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