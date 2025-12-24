// tickets.js

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  loadTickets();
  document.getElementById('ticket-form').addEventListener('submit', handleSubmit);
  document.getElementById('logout-link').addEventListener('click', logout);
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

async function loadTickets() {
  try {
    const response = await fetch('/api/tickets');
    const tickets = await response.json();
    const container = document.getElementById('ticket-list');
    container.innerHTML = '';
    tickets.forEach(ticket => {
      const div = document.createElement('div');
      div.className = 'server-card';
      div.innerHTML = `
        <h4>${ticket.subject}</h4>
        <p>${ticket.message}</p>
        <p><strong>Statut:</strong> ${ticket.status}</p>
        ${ticket.response ? `<p><strong>Réponse:</strong> ${ticket.response}</p>` : ''}
      `;
      container.appendChild(div);
    });
  } catch (error) {
    console.error('Error loading tickets:', error);
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const formData = {
    subject: document.getElementById('subject').value,
    message: document.getElementById('message').value
  };

  try {
    const response = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert('Ticket envoyé !');
      document.getElementById('ticket-form').reset();
      loadTickets();
    } else {
      alert('Erreur lors de l\'envoi');
    }
  } catch (error) {
    console.error('Error submitting ticket:', error);
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