// edit-server.js - Gestion de l'édition de serveur

const validationRules = {
  name: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_àâäéèêëïîôùûüœæÀÂÄÉÈÊËÏÎÔÙÛÜŒÆ]+$/,
    message: 'Le nom doit contenir 3-100 caractères alphanumériques'
  },
  'invite-link': {
    pattern: /^https:\/\/discord\.gg\/[a-zA-Z0-9]+$/,
    message: 'Lien Discord invalide (ex: https://discord.gg/xxxxx)'
  },
  description: {
    minLength: 50,
    maxLength: 2000,
    message: 'La description doit contenir 50-2000 caractères'
  },
  'member-count': {
    min: 1,
    message: 'Le nombre de membres doit être au moins 1'
  }
};

let categories = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadCategories();
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

function loadCategories() {
  fetch('/api/categories')
    .then(response => response.json())
    .then(data => {
      categories = data;
      const categorySelect = document.getElementById('category');
      categorySelect.innerHTML = '<option value="">Sélectionner...</option>';
      categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = `${cat.icon} ${cat.name}`;
        categorySelect.appendChild(option);
      });
    })
    .catch(error => console.error('Error loading categories:', error));
}

function setupEventListeners() {
  const form = document.getElementById('edit-server-form');
  
  // Validation en temps réel
  document.getElementById('name').addEventListener('input', (e) => {
    document.getElementById('nameCount').textContent = e.target.value.length;
    validateField('name');
  });
  
  document.getElementById('description').addEventListener('input', (e) => {
    document.getElementById('descCount').textContent = e.target.value.length;
    validateField('description');
  });
  
  document.getElementById('tags').addEventListener('input', (e) => {
    document.getElementById('tagsCount').textContent = e.target.value.length;
  });

  document.getElementById('invite-link').addEventListener('change', () => validateField('invite-link'));
  document.getElementById('member-count').addEventListener('change', () => validateField('member-count'));

  // Prévisualisations d'images
  document.getElementById('icon').addEventListener('change', (e) => handleImagePreview(e, 'iconPreview'));
  document.getElementById('banner').addEventListener('change', (e) => handleImagePreview(e, 'bannerPreview'));

  // Soumission du formulaire
  form.addEventListener('submit', updateServer);
  document.getElementById('delete-server-btn').addEventListener('click', deleteServer);
  document.getElementById('logout-link').addEventListener('click', logout);
}

function validateField(fieldName) {
  const field = document.getElementById(fieldName);
  const value = field.value.trim();
  const rules = validationRules[fieldName];
  
  clearError(fieldName);
  
  if (!rules) return true;
  
  if (rules.minLength && value.length < rules.minLength && value.length > 0) {
    showError(fieldName, `Minimum ${rules.minLength} caractères requis`);
    return false;
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    showError(fieldName, `Maximum ${rules.maxLength} caractères autorisés`);
    return false;
  }
  
  if (rules.pattern && value && !rules.pattern.test(value)) {
    showError(fieldName, rules.message);
    return false;
  }
  
  if (rules.min && parseInt(value) < rules.min) {
    showError(fieldName, rules.message);
    return false;
  }
  
  return true;
}

function handleImagePreview(event, previewElementId) {
  const url = event.target.value;
  const fieldName = event.target.id;
  
  clearError(fieldName);
  
  if (!url) {
    // Réinitialiser l'aperçu
    if (fieldName === 'icon') {
      document.getElementById('iconPreviewContainer').innerHTML = '<div class="preview-image-placeholder">🖼️</div>';
      document.getElementById('iconFilename').textContent = 'Aucune image';
    } else if (fieldName === 'banner') {
      document.getElementById('bannerPreviewContainer').innerHTML = '<div class="preview-image-placeholder">📸</div>';
      document.getElementById('bannerFilename').textContent = 'Aucune image';
    }
    return;
  }
  
  // Valider que c'est une URL
  if (!isValidUrl(url)) {
    showError(fieldName, 'URL invalide');
    return;
  }
  
  // Charger et afficher l'image
  const img = new Image();
  img.onload = () => {
    if (fieldName === 'icon') {
      document.getElementById('iconPreviewContainer').innerHTML = `<img src="${url}" alt="Logo">`;
      document.getElementById('iconFilename').textContent = url.split('/').pop() || 'Logo du serveur';
    } else if (fieldName === 'banner') {
      document.getElementById('bannerPreviewContainer').innerHTML = `<img src="${url}" alt="Bannière">`;
      document.getElementById('bannerFilename').textContent = url.split('/').pop() || 'Bannière du serveur';
    }
  };
  img.onerror = () => {
    showError(fieldName, 'Impossible de charger l\'image (URL invalide ou inaccessible)');
  };
  img.src = url;
}

function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

function showError(fieldName, message) {
  const errorElement = document.getElementById(`error-${fieldName}`);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

function clearError(fieldName) {
  const errorElement = document.getElementById(`error-${fieldName}`);
  if (errorElement) {
    errorElement.textContent = '';
    errorElement.style.display = 'none';
  }
}

function showAlert(message, type = 'info') {
  const alertElement = document.getElementById('alert-message');
  alertElement.textContent = message;
  alertElement.className = `alert alert-${type}`;
  alertElement.style.display = 'block';
  
  if (type === 'success') {
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
  }
}

async function loadServerData() {
  const urlParams = new URLSearchParams(window.location.search);
  const serverId = urlParams.get('id');

  if (!serverId) {
    showAlert('❌ ID de serveur manquant', 'error');
    setTimeout(() => window.location.href = 'index.html', 2000);
    return;
  }

  try {
    const [serverResponse, userResponse] = await Promise.all([
      fetch(`/api/servers/${serverId}`),
      fetch('/api/auth/me')
    ]);

    if (!serverResponse.ok) {
      showAlert('❌ Serveur non trouvé', 'error');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return;
    }

    const server = await serverResponse.json();
    const user = await userResponse.json();

    // Vérifier que l'utilisateur est propriétaire du serveur
    if (server.submittedBy !== user.id && user.role !== 'admin' && user.role !== 'developer') {
      showAlert('❌ Vous n\'avez pas l\'autorisation de modifier ce serveur', 'error');
      setTimeout(() => window.location.href = 'index.html', 2000);
      return;
    }

    // Remplir le formulaire
    document.getElementById('server-id').value = server.id;
    document.getElementById('name').value = server.name;
    document.getElementById('nameCount').textContent = server.name.length;
    document.getElementById('invite-link').value = server.inviteLink;
    document.getElementById('banner').value = server.banner || '';
    document.getElementById('icon').value = server.icon || '';
    document.getElementById('description').value = server.description;
    document.getElementById('descCount').textContent = server.description.length;
    document.getElementById('member-count').value = server.memberCount;
    document.getElementById('server-type').value = server.serverType || '';
    document.getElementById('category').value = server.category || '';
    document.getElementById('activity-level').value = server.activityLevel || 'Medium';
    document.getElementById('language').value = server.language || 'fr';
    document.getElementById('region').value = server.region || 'Europe';
    document.getElementById('tags').value = server.tags ? server.tags.join(', ') : '';
    document.getElementById('tagsCount').textContent = (server.tags ? server.tags.join(', ') : '').length;

    // Charger les prévisualisations
    if (server.icon) {
      const iconInput = document.getElementById('icon');
      iconInput.dispatchEvent(new Event('change'));
    }
    if (server.banner) {
      const bannerInput = document.getElementById('banner');
      bannerInput.dispatchEvent(new Event('change'));
    }

  } catch (error) {
    console.error('Error loading server data:', error);
    showAlert('❌ Erreur lors du chargement des données du serveur', 'error');
    setTimeout(() => window.location.href = 'index.html', 2000);
  }
}

async function updateServer(event) {
  event.preventDefault();

  // Valider les champs requis
  const requiredFields = ['name', 'invite-link', 'description', 'member-count', 'server-type', 'activity-level'];
  let isValid = true;

  requiredFields.forEach(fieldName => {
    if (!validateField(fieldName)) {
      isValid = false;
    }
  });

  if (!isValid) {
    showAlert('❌ Veuillez corriger les erreurs du formulaire', 'error');
    return;
  }

  const formData = new FormData(event.target);
  const serverId = formData.get('server-id');

  const serverData = {
    name: formData.get('name').trim(),
    inviteLink: formData.get('invite-link').trim(),
    banner: formData.get('banner') ? formData.get('banner').trim() : undefined,
    icon: formData.get('icon') ? formData.get('icon').trim() : undefined,
    description: formData.get('description').trim(),
    memberCount: parseInt(formData.get('member-count')),
    serverType: formData.get('server-type'),
    category: formData.get('category'),
    activityLevel: formData.get('activity-level'),
    language: formData.get('language') || 'fr',
    region: formData.get('region') || 'Europe',
    tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(tag => tag)
  };

  const btn = event.target.querySelector('button[type="submit"]');
  const btnText = btn.querySelector('.btn-text');
  const btnLoader = btn.querySelector('.btn-loader');
  
  btn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';

  try {
    const response = await fetch(`/api/servers/${serverId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(serverData)
    });

    if (response.ok) {
      showAlert('✅ Serveur mis à jour avec succès !', 'success');
    } else {
      const error = await response.json();
      showAlert('❌ Erreur: ' + (error.message || 'Impossible de mettre à jour le serveur'), 'error');
      btn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  } catch (error) {
    console.error('Error updating server:', error);
    showAlert('❌ Erreur réseau lors de la mise à jour', 'error');
    btn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
  }
}

async function deleteServer() {
  if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce serveur ? Cette action est irréversible.')) {
    return;
  }

  const serverId = document.getElementById('server-id').value;

  try {
    const response = await fetch(`/api/servers/${serverId}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showAlert('✅ Serveur supprimé avec succès !', 'success');
    } else {
      const error = await response.json();
      showAlert('❌ Erreur: ' + (error.message || 'Impossible de supprimer le serveur'), 'error');
    }
  } catch (error) {
    console.error('Error deleting server:', error);
    showAlert('❌ Erreur réseau lors de la suppression', 'error');
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