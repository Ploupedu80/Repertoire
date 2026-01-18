// submit.js

// Configuration des validations
const validationRules = {
  name: {
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_àâäéèêëïîôùûüœæÀÂÄÉÈÊËÏÎÔÙÛÜŒÆ]+$/,
    message: 'Le nom doit contenir 3-100 caractères alphanumériques'
  },
  inviteLink: {
    pattern: /^https:\/\/discord\.gg\/[a-zA-Z0-9]+$/,
    message: 'Lien Discord invalide (ex: https://discord.gg/xxxxx)'
  },
  description: {
    minLength: 50,
    maxLength: 2000,
    message: 'La description doit contenir 50-2000 caractères'
  },
  memberCount: {
    min: 1,
    message: 'Le nombre de membres doit être au moins 1'
  }
};

// Taille max des fichiers (en bytes)
const MAX_ICON_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_BANNER_SIZE = 10 * 1024 * 1024; // 10 MB

document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  loadCategories();
  setupFormListeners();
  document.getElementById('logout-link').addEventListener('click', logout);
});

function setupFormListeners() {
  const form = document.getElementById('submit-form');
  
  // Listeners pour validation en temps réel
  document.getElementById('name').addEventListener('input', (e) => {
    updateCharCount('nameCount', e.target.value);
    validateField('name');
    updateProgress();
  });
  
  document.getElementById('description').addEventListener('input', (e) => {
    updateCharCount('descCount', e.target.value);
    validateField('description');
    updateProgress();
  });
  
  document.getElementById('tags').addEventListener('input', (e) => {
    updateCharCount('tagsCount', e.target.value);
  });
  
  document.getElementById('inviteLink').addEventListener('change', () => validateField('inviteLink'));
  document.getElementById('memberCount').addEventListener('change', () => validateField('memberCount'));
  document.getElementById('category').addEventListener('change', updateProgress);
  document.getElementById('serverType').addEventListener('change', updateProgress);
  document.getElementById('language').addEventListener('change', updateProgress);
  document.getElementById('region').addEventListener('change', updateProgress);
  
  // Listeners pour les fichiers
  document.getElementById('icon').addEventListener('change', (e) => {
    handleFilePreview(e, 'iconPreview', MAX_ICON_SIZE, 'icon');
  });
  
  document.getElementById('banner').addEventListener('change', (e) => {
    handleFilePreview(e, 'bannerPreview', MAX_BANNER_SIZE, 'banner');
  });
  
  // Listeners pour le click sur les wrappers de fichiers
  const iconWrapper = document.querySelector('input[id="icon"]').parentElement;
  const bannerWrapper = document.querySelector('input[id="banner"]').parentElement;
  
  if (iconWrapper) {
    iconWrapper.addEventListener('click', () => {
      document.getElementById('icon').click();
    });
  }
  
  if (bannerWrapper) {
    bannerWrapper.addEventListener('click', () => {
      document.getElementById('banner').click();
    });
  }
  
  // Soumission du formulaire
  form.addEventListener('submit', handleSubmit);
}

function updateCharCount(elementId, value) {
  document.getElementById(elementId).textContent = value.length;
}

function updateProgress() {
  const requiredFields = ['name', 'inviteLink', 'memberCount', 'description', 'category', 'serverType', 'language', 'region'];
  let filled = 0;
  
  requiredFields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field && field.value.trim()) {
      filled++;
    }
  });
  
  const progress = Math.round((filled / requiredFields.length) * 100);
  document.getElementById('progressBar').style.width = progress + '%';
  document.getElementById('progressPercent').textContent = progress;
}

function handleFilePreview(event, previewElementId, maxSize, fieldName) {
  const file = event.target.files[0];
  const previewElement = document.getElementById(previewElementId);
  const errorElement = document.getElementById(`error-${fieldName}`);
  
  clearError(fieldName);
  previewElement.innerHTML = '';
  
  if (!file) return;
  
  // Vérifier la taille
  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    showError(fieldName, `Le fichier dépasse ${maxSizeMB}MB`);
    event.target.value = '';
    return;
  }
  
  // Vérifier le type
  if (!file.type.startsWith('image/')) {
    showError(fieldName, 'Veuillez sélectionner une image valide');
    event.target.value = '';
    return;
  }
  
  // Afficher la prévisualisation
  const reader = new FileReader();
  reader.onload = (e) => {
    previewElement.innerHTML = `
      <div class="file-preview show">
        <img src="${e.target.result}" alt="Prévisualisation">
        <p>${file.name}</p>
        <p class="file-size">${(file.size / 1024).toFixed(2)} KB</p>
      </div>
    `;
  };
  reader.readAsDataURL(file);
}

function validateField(fieldName) {
  const field = document.getElementById(fieldName);
  const value = field.value.trim();
  const rules = validationRules[fieldName];
  
  clearError(fieldName);
  
  if (!rules) return true;
  
  // Vérifier minLength
  if (rules.minLength && value.length < rules.minLength && value.length > 0) {
    showError(fieldName, `Minimum ${rules.minLength} caractères requis`);
    return false;
  }
  
  // Vérifier maxLength
  if (rules.maxLength && value.length > rules.maxLength) {
    showError(fieldName, `Maximum ${rules.maxLength} caractères autorisés`);
    return false;
  }
  
  // Vérifier le pattern
  if (rules.pattern && value && !rules.pattern.test(value)) {
    showError(fieldName, rules.message);
    return false;
  }
  
  return true;
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

function showAlert(message, type = 'success') {
  const alertContainer = document.getElementById('alertContainer');
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type}`;
  alertElement.innerHTML = `
    <p>${message}</p>
    <button class="alert-close" onclick="this.parentElement.remove()">×</button>
  `;
  alertContainer.appendChild(alertElement);
  
  if (type === 'success') {
    setTimeout(() => alertElement.remove(), 5000);
  }
}

async function loadCategories() {
  try {
    const response = await fetch('/api/categories');
    const categories = await response.json();
    
    const categorySelect = document.getElementById('category');
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.icon} ${category.name}`;
      categorySelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error loading categories:', error);
    // Add default categories if API fails
    addDefaultCategories();
  }
}

function addDefaultCategories() {
  const categorySelect = document.getElementById('category');
  const defaultCategories = [
    { id: 'gaming', name: 'Gaming', icon: '🎮' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'study', name: 'Étude', icon: '📚' },
    { id: 'music', name: 'Musique', icon: '🎵' },
    { id: 'art', name: 'Art & Design', icon: '🎨' },
    { id: 'programming', name: 'Programmation', icon: '💻' },
    { id: 'business', name: 'Affaires', icon: '💼' },
    { id: 'entertainment', name: 'Divertissement', icon: '🎬' },
    { id: 'sports', name: 'Sports', icon: '⚽' },
    { id: 'anime', name: 'Anime', icon: '🌸' }
  ];
  
  defaultCategories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = `${category.icon} ${category.name}`;
    categorySelect.appendChild(option);
  });
}

async function checkLogin() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      window.location.href = 'login.html';
    }
  } catch (error) {
    console.error('Error checking login:', error);
    window.location.href = 'login.html';
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  
  // Valider tous les champs
  const requiredFields = ['name', 'inviteLink', 'memberCount', 'description'];
  let isValid = true;
  
  requiredFields.forEach(fieldName => {
    if (!validateField(fieldName)) {
      isValid = false;
    }
  });
  
  if (!isValid) {
    showAlert('Veuillez corriger les erreurs dans le formulaire', 'error');
    return;
  }
  
  // Confirmation avant soumission
  if (!confirm('Êtes-vous sûr de vouloir soumettre ce serveur ? Il sera examiné par notre modération.')) {
    return;
  }
  
  // Désactiver le bouton et afficher le loader
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoader = submitBtn.querySelector('.btn-loader');
  submitBtn.disabled = true;
  btnText.style.display = 'none';
  btnLoader.style.display = 'inline';

  const formData = new FormData();
  formData.append('name', document.getElementById('name').value.trim());
  formData.append('inviteLink', document.getElementById('inviteLink').value.trim());
  
  const iconFile = document.getElementById('icon').files[0];
  if (iconFile) {
    formData.append('icon', iconFile);
  }
  
  const bannerFile = document.getElementById('banner').files[0];
  if (bannerFile) {
    formData.append('banner', bannerFile);
  }
  
  formData.append('description', document.getElementById('description').value.trim());
  formData.append('memberCount', document.getElementById('memberCount').value);
  formData.append('serverType', document.getElementById('serverType').value);
  formData.append('category', document.getElementById('category').value);
  formData.append('language', document.getElementById('language').value);
  formData.append('region', document.getElementById('region').value);
  formData.append('tags', document.getElementById('tags').value.trim());

  try {
    const response = await fetch('/api/servers', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      showAlert('✅ Serveur soumis avec succès ! En attente d\'approbation.', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    } else {
      let errorMessage = 'Erreur inconnue';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || 'Erreur inconnue';
      } catch (jsonError) {
        errorMessage = `Erreur HTTP ${response.status}: ${response.statusText}`;
      }
      showAlert(`❌ Erreur: ${errorMessage}`, 'error');
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  } catch (error) {
    console.error('Error submitting server:', error);
    showAlert(`❌ Erreur réseau: ${error.message}`, 'error');
    submitBtn.disabled = false;
    btnText.style.display = 'inline';
    btnLoader.style.display = 'none';
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