// submit.js

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  document.getElementById('submit-form').addEventListener('submit', handleSubmit);
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

async function handleSubmit(event) {
  event.preventDefault();

  const formData = {
    name: document.getElementById('name').value,
    inviteLink: document.getElementById('inviteLink').value,
    icon: document.getElementById('icon').value,
    banner: document.getElementById('banner').value,
    description: document.getElementById('description').value,
    memberCount: document.getElementById('memberCount').value,
    activityLevel: document.getElementById('activityLevel').value,
    serverType: document.getElementById('serverType').value,
    tags: document.getElementById('tags').value
  };

  try {
    const response = await fetch('/api/servers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (response.ok) {
      alert('Serveur soumis avec succès ! En attente d\'approbation.');
      window.location.href = 'index.html';
    } else {
      alert('Erreur lors de la soumission');
    }
  } catch (error) {
    console.error('Error submitting server:', error);
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