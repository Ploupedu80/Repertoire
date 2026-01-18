let currentUser = null;
let currentTicketId = null;

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  loadTickets();
  document.getElementById('ticket-form').addEventListener('submit', handleSubmit);
  document.getElementById('logout-link').addEventListener('click', logout);
  
  // Close modal on background click
  document.getElementById('ticket-modal').addEventListener('click', (e) => {
    if (e.target.id === 'ticket-modal') {
      closeTicketModal();
    }
  });
});

async function checkLogin() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      window.location.href = 'login.html';
      return;
    }
    currentUser = await response.json();
    
    // Check if user is blacklisted
    if (currentUser.blacklisted) {
      showBlacklistModal(currentUser);
      return;
    }
    
    // Check for active ban sanctions
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
        showBanModal(currentUser, ban);
        return;
      }
    }
    
    // Check for appeal parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('appeal') === 'true') {
      const reason = urlParams.get('reason') || '';
      prefillAppealTicket(reason);
    }
  } catch (error) {
    console.error('Error checking login:', error);
    window.location.href = 'login.html';
  }
}

async function loadTickets() {
  try {
    const response = await fetch('/api/tickets');
    if (!response.ok) {
      throw new Error('Failed to load tickets');
    }
    const tickets = await response.json();
    
    const container = document.getElementById('tickets-container');
    
    if (tickets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📭</div>
          <p>Vous n'avez pas encore de tickets. Créez-en un pour commencer!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    tickets.forEach(ticket => {
      const card = createTicketCard(ticket);
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading tickets:', error);
    document.getElementById('tickets-container').innerHTML = `
      <div class="empty-state">
        <p>Erreur lors du chargement des tickets</p>
      </div>
    `;
  }
}

function createTicketCard(ticket) {
  const card = document.createElement('div');
  card.className = 'ticket-card';
  
  const createdDate = new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const statusEmoji = {
    'open': '🟡',
    'in-progress': '🔵',
    'resolved': '🟢',
    'closed': '⚫'
  };

  const priorityIcon = {
    'low': '⬇️',
    'normal': '➡️',
    'high': '⬆️',
    'urgent': '🔴'
  };

  const responseCount = (ticket.responses || []).length;

  card.innerHTML = `
    <div class="ticket-header">
      <h3 class="ticket-title">#${ticket.id.substring(0, 8)} - ${ticket.subject}</h3>
      <div class="ticket-badges">
        <span class="ticket-badge badge-status ${ticket.status}">
          ${statusEmoji[ticket.status] || '❓'} ${ticket.status.replace('-', ' ')}
        </span>
        <span class="ticket-badge badge-priority ${ticket.priority}">
          ${priorityIcon[ticket.priority] || '❓'} ${ticket.priority}
        </span>
      </div>
    </div>
    <div class="ticket-meta">
      <span>📅 Créé: ${createdDate}</span>
      <span>💬 ${responseCount} réponse${responseCount !== 1 ? 's' : ''}</span>
      <span>🏷️ ${ticket.category}</span>
    </div>
    <p class="ticket-preview">${ticket.message}</p>
  `;

  card.addEventListener('click', () => openTicketModal(ticket));
  
  return card;
}

async function openTicketModal(ticket) {
  currentTicketId = ticket.id;
  
  document.getElementById('modal-title').textContent = ticket.subject;
  document.getElementById('modal-id').textContent = `#${ticket.id.substring(0, 8)}`;
  document.getElementById('modal-created').textContent = new Date(ticket.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const statusText = {
    'open': '🟡 Ouvert',
    'in-progress': '🔵 En cours',
    'resolved': '🟢 Résolu',
    'closed': '⚫ Fermé'
  };
  document.getElementById('modal-status').textContent = statusText[ticket.status] || ticket.status;
  
  const priorityText = {
    'low': '⬇️ Basse',
    'normal': '➡️ Normal',
    'high': '⬆️ Haute',
    'urgent': '🔴 Urgent'
  };
  document.getElementById('modal-priority').textContent = priorityText[ticket.priority] || ticket.priority;
  
  document.getElementById('modal-message').textContent = ticket.message;
  
  // Load responses
  const responses = ticket.responses || [];
  const responsesList = document.getElementById('responses-list');
  
  if (responses.length === 0) {
    document.getElementById('responses-section').style.display = 'none';
  } else {
    document.getElementById('responses-section').style.display = 'block';
    responsesList.innerHTML = '';
    
    responses.forEach(response => {
      const responseEl = document.createElement('div');
      responseEl.className = response.isAdmin ? 'response-item admin' : 'response-item';
      
      const responseDate = new Date(response.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      responseEl.innerHTML = `
        <div class="response-header">
          <span class="response-author">${response.username}</span>
          <div>
            ${response.isAdmin ? '<span class="response-admin-badge">👨‍💼 ÉQUIPE</span>' : ''}
            <span class="response-date">${responseDate}</span>
          </div>
        </div>
        <div class="response-message">${response.message}</div>
      `;
      
      responsesList.appendChild(responseEl);
    });
  }
  
  document.getElementById('ticket-modal').classList.add('active');
}

function closeTicketModal() {
  document.getElementById('ticket-modal').classList.remove('active');
  document.getElementById('response-message').value = '';
  currentTicketId = null;
}

async function addResponse() {
  if (!currentTicketId) return;
  
  const message = document.getElementById('response-message').value.trim();
  if (!message) {
    alert('Veuillez écrire un message');
    return;
  }

  try {
    const response = await fetch(`/api/tickets/${currentTicketId}/response`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error('Failed to add response');
    }

    document.getElementById('response-message').value = '';
    
    // Reload tickets to show new response
    loadTickets();
    
    // Reopen the ticket modal with updated data
    const updatedResponse = await fetch(`/api/tickets/${currentTicketId}`);
    const updatedTicket = await updatedResponse.json();
    openTicketModal(updatedTicket);
  } catch (error) {
    console.error('Error adding response:', error);
    alert('Erreur lors de l\'envoi de la réponse');
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = {
    subject: document.getElementById('subject').value.trim(),
    message: document.getElementById('message').value.trim(),
    category: document.getElementById('category').value,
    priority: document.getElementById('priority').value
  };

  if (!formData.subject || !formData.message) {
    alert('Veuillez remplir tous les champs obligatoires');
    return;
  }

  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error('Failed to create ticket');
    }

    // Show success message
    alert('✅ Ticket créé avec succès! Notre équipe vous répondra bientôt.');
    document.getElementById('ticket-form').reset();
    loadTickets();
    
    // Scroll to tickets list
    document.querySelector('.tickets-section').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error submitting ticket:', error);
    alert('❌ Erreur lors de la création du ticket');
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

function prefillAppealTicket(reason) {
  // Prefill the ticket form for appeal
  document.getElementById('ticket-subject').value = 'Appel de sanction - Blacklist';
  document.getElementById('ticket-message').value = `Je fais appel de ma sanction de blacklist.\n\nRaison de la sanction originale : ${reason}\n\nExplication de mon appel : [Veuillez expliquer pourquoi vous pensez que cette sanction est injustifiée]`;
  
  // Scroll to form
  document.getElementById('ticket-form').scrollIntoView({ behavior: 'smooth' });
}
async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Error logging out:', error);
  }
}