// edit-server.js - Gestion de l'édition de serveur

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadServerData();
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
  document.getElementById('edit-server-form').addEventListener('submit', updateServer);
  document.getElementById('delete-server-btn').addEventListener('click', deleteServer);
  document.getElementById('logout-link').addEventListener('click', logout);
}

async function loadServerData() {
  const urlParams = new URLSearchParams(window.location.search);
  const serverId = urlParams.get('id');

  if (!serverId) {
    alert('ID de serveur manquant');
    window.location.href = 'index.html';
    return;
  }

  try {
    const [serverResponse, userResponse] = await Promise.all([
      fetch(`/api/servers/${serverId}`),
      fetch('/api/auth/me')
    ]);

    if (!serverResponse.ok) {
      alert('Serveur non trouvé');
      window.location.href = 'index.html';
      return;
    }

    const server = await serverResponse.json();
    const user = await userResponse.json();

    // Vérifier que l'utilisateur est propriétaire du serveur
    if (server.submittedBy !== user.id) {
      alert('Vous n\'avez pas l\'autorisation de modifier ce serveur');
      window.location.href = 'index.html';
      return;
    }

    // Remplir le formulaire
    document.getElementById('server-id').value = server.id;
    document.getElementById('name').value = server.name;
    document.getElementById('invite-link').value = server.inviteLink;
    document.getElementById('banner').value = server.banner || '';
    document.getElementById('icon').value = server.icon || '';
    document.getElementById('description').value = server.description;
    document.getElementById('member-count').value = server.memberCount;
    document.getElementById('server-type').value = server.serverType;
    document.getElementById('activity-level').value = server.activityLevel;
    document.getElementById('tags').value = server.tags.join(', ');

  } catch (error) {
    console.error('Error loading server data:', error);
    alert('Erreur lors du chargement des données du serveur');
    window.location.href = 'index.html';
  }
}

async function updateServer(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const serverId = formData.get('server-id');

  const serverData = {
    name: formData.get('name'),
    inviteLink: formData.get('invite-link'),
    banner: formData.get('banner') || undefined,
    icon: formData.get('icon') || undefined,
    description: formData.get('description'),
    memberCount: parseInt(formData.get('member-count')),
    serverType: formData.get('server-type'),
    activityLevel: formData.get('activity-level'),
    tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag)
  };

  try {
    const response = await fetch(`/api/servers/${serverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serverData)
    });

    if (response.ok) {
      alert('Serveur mis à jour avec succès !');
      window.location.href = 'index.html';
    } else {
      const error = await response.json();
      alert('Erreur: ' + (error.message || 'Impossible de mettre à jour le serveur'));
    }
  } catch (error) {
    console.error('Error updating server:', error);
    alert('Erreur réseau lors de la mise à jour');
  }
}

async function deleteServer() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce serveur ? Cette action est irréversible.')) {
    return;
  }

  const serverId = document.getElementById('server-id').value;

  try {
    const response = await fetch(`/api/servers/${serverId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('Serveur supprimé avec succès !');
      window.location.href = 'index.html';
    } else {
      const error = await response.json();
      alert('Erreur: ' + (error.message || 'Impossible de supprimer le serveur'));
    }
  } catch (error) {
    console.error('Error deleting server:', error);
    alert('Erreur réseau lors de la suppression');
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