// app.js - Main application logic

document.addEventListener('DOMContentLoaded', () => {
  loadCategories();
  loadServers();
  loadAnnouncements();
  checkLoginStatus();
  setupEventListeners();
  loadHeroStats();
  setActiveNavLink();
});

let allServers = [];
let currentUser = null;
let categories = [];

function loadCategories() {
  fetch('/api/categories')
    .then(response => response.json())
    .then(data => {
      categories = data;
      populateCategoryFilter();
    })
    .catch(error => console.error('Error loading categories:', error));
}

function populateCategoryFilter() {
  const categoryFilter = document.getElementById('category-filter');
  if (!categoryFilter) return; // Exit if element doesn't exist
  
  categoryFilter.innerHTML = '<option value="">Toutes les catégories</option>';
  
  categories.forEach(category => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = `${category.icon} ${category.name}`;
    categoryFilter.appendChild(option);
  });
}

function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
}

function getCategoryIcon(categoryId) {
  const category = categories.find(c => c.id === categoryId);
  return category ? category.icon : '🎮';
}

function getCategoryName(categoryId) {
  const category = categories.find(c => c.id === categoryId);
  return category ? category.name : categoryId;
}

function setupEventListeners() {
  // Search and filter elements (only on pages that have them)
  const search = document.getElementById('search');
  if (search) search.addEventListener('input', filterServers);
  
  const filterToggle = document.getElementById('filter-toggle');
  if (filterToggle) filterToggle.addEventListener('click', toggleFilterModal);
  
  const closeFilterModal = document.getElementById('close-filter-modal');
  if (closeFilterModal) closeFilterModal.addEventListener('click', () => {
    document.getElementById('filter-modal').style.display = 'none';
  });
  
  const applyFilters = document.getElementById('apply-filters');
  if (applyFilters) applyFilters.addEventListener('click', () => {
    filterServers();
    document.getElementById('filter-modal').style.display = 'none';
  });
  
  const resetFilters = document.getElementById('reset-filters');
  if (resetFilters) resetFilters.addEventListener('click', () => {
    document.getElementById('category-filter').value = '';
    document.getElementById('language-filter').value = '';
    document.getElementById('region-filter').value = '';
    document.getElementById('members-filter').value = '';
    document.getElementById('sort-filter').value = '';
    filterServers();
  });
  
  // Filtrer en temps réel
  const filterElements = ['category-filter', 'language-filter', 'region-filter', 'members-filter', 'sort-filter'];
  filterElements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', filterServers);
    }
  });
  
  // Navigation links
  const homeLink = document.getElementById('home-link');
  if (homeLink) homeLink.addEventListener('click', () => window.location.href = 'landing.html');
  
  const exploreLink = document.getElementById('explore-link');
  if (exploreLink) exploreLink.addEventListener('click', () => window.location.href = 'index.html');
  
  const addServerLink = document.getElementById('add-server-link');
  if (addServerLink) addServerLink.addEventListener('click', () => window.location.href = 'submit.html');
  
  const profileDropdown = document.getElementById('profile-dropdown');
  if (profileDropdown) profileDropdown.addEventListener('click', toggleDropdown);
  
  const loginLink = document.getElementById('login-link');
  if (loginLink) loginLink.addEventListener('click', () => window.location.href = 'login.html');
  
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) logoutLink.addEventListener('click', logout);

  // Close modal when clicking outside
  const filterModal = document.getElementById('filter-modal');
  if (filterModal) {
    filterModal.addEventListener('click', (e) => {
      if (e.target.id === 'filter-modal') {
        filterModal.style.display = 'none';
      }
    });
  }
}

function setActiveNavLink() {
  const currentPage = window.location.pathname;
  
  // Remove active class from all nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  
  // Add active class based on current page
  if (currentPage.includes('index.html') || currentPage === '/') {
    const exploreLink = document.getElementById('explore-link');
    if (exploreLink) exploreLink.classList.add('active');
  } else if (currentPage.includes('landing.html')) {
    const homeLink = document.getElementById('home-link');
    if (homeLink) homeLink.classList.add('active');
  } else if (currentPage.includes('submit.html')) {
    const addLink = document.getElementById('add-server-link');
    if (addLink) addLink.classList.add('active');
  } else if (currentPage.includes('top-servers.html')) {
    const rankingLink = document.getElementById('ranking-link');
    if (rankingLink) rankingLink.classList.add('active');
  }
}

function loadHeroStats() {
  // Load servers count
  fetch('/api/servers')
    .then(response => response.json())
    .then(data => {
      const serversCount = document.getElementById('hero-servers-count');
      if (serversCount) {
        serversCount.textContent = data.length;
      }
    })
    .catch(error => console.error('Error loading servers count:', error));

  // Load users count
  fetch('/api/users')
    .then(response => response && response.ok ? response.json() : null)
    .then(data => {
      if (data) {
        const usersCount = document.getElementById('hero-users-count');
        if (usersCount) {
          usersCount.textContent = data.length;
        }
      }
    })
    .catch(error => console.log('Users count not available'));

  // Load reviews count
  fetch('/api/reviews')
    .then(response => response.json())
    .then(data => {
      const reviewsCount = document.getElementById('hero-reviews-count');
      if (reviewsCount) {
        reviewsCount.textContent = data.length;
      }
    })
    .catch(error => console.error('Error loading reviews count:', error));
}

function toggleDropdown() {
  const menu = document.getElementById('dropdown-menu');
  menu.classList.toggle('show');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profile-dropdown');
  const menu = document.getElementById('dropdown-menu');
  if (!dropdown.contains(e.target)) {
    menu.classList.remove('show');
  }
});

function showRanking() {
  window.location.href = 'top-servers.html';
}

async function checkLoginStatus() {
  try {
    const response = await fetch('/api/auth/me').catch(() => null);
    if (response && response.ok) {
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
      
      document.getElementById('login-link').style.display = 'none';
      document.getElementById('profile-dropdown').style.display = 'flex';
      // Set avatar
      if (currentUser.avatar) {
        document.getElementById('nav-avatar').src = `https://cdn.discordapp.com/avatars/${currentUser.discordId}/${currentUser.avatar}.png`;
      } else {
        document.getElementById('nav-avatar').src = '/asset/default-avatar.png'; // Placeholder
      }
      
      // Load notification count
      loadNotificationCount();
      
      // Setup notification button
      const notificationsBtn = document.getElementById('notifications-btn');
      if (notificationsBtn) {
        notificationsBtn.addEventListener('click', () => {
          window.location.href = 'notifications.html';
        });
      }
      
      // Refresh notification count every 30 seconds
      setInterval(loadNotificationCount, 30000);
    }
  } catch (error) {
    console.error('Error checking login status:', error);
  }
}

async function loadNotificationCount() {
  try {
    const response = await fetch('/api/notifications/count');
    if (response.ok) {
      const data = await response.json();
      const countEl = document.getElementById('notifications-count');
      if (countEl) {
        if (data.unreadCount > 0) {
          countEl.textContent = data.unreadCount;
          countEl.style.display = 'flex';
        } else {
          countEl.style.display = 'none';
        }
      }
    }
  } catch (error) {
    console.error('Error loading notification count:', error);
  }
}

async function loadServers() {
  try {
    // Load categories first if not loaded
    if (categories.length === 0) {
      await loadCategories();
    }
    
    // Build query string from current filters
    const params = new URLSearchParams();
    const search = document.getElementById('search').value;
    if (search) params.append('search', search);
    
    const category = document.getElementById('category-filter')?.value;
    if (category) params.append('category', category);
    
    const language = document.getElementById('language-filter')?.value;
    if (language) params.append('language', language);
    
    const region = document.getElementById('region-filter')?.value;
    if (region) params.append('region', region);
    
    const members = document.getElementById('members-filter')?.value;
    if (members) {
      const [min, max] = members.split('-');
      if (min) params.append('minMembers', min);
      if (max && max !== '+') params.append('maxMembers', max);
    }
    
    const sort = document.getElementById('sort-filter')?.value;
    if (sort) params.append('sort', sort);

    const [serversResponse, userResponse] = await Promise.all([
      fetch(`/api/servers?${params.toString()}`),
      fetch('/api/auth/me').catch(() => null)
    ]);

    const servers = await serversResponse.json();
    const user = userResponse && userResponse.ok ? await userResponse.json() : null;
    currentUser = user;

    // Afficher TOUS les serveurs y compris les suspendus
    allServers = servers;
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
  const isSuspended = server.suspended === true;
  const canSeeSuspensionDetails = isOwner || (user && ['admin', 'developer', 'moderator'].includes(user.role));

  const activityClass = server.activityLevel.toLowerCase();

  // Add suspended class to card
  if (isSuspended) {
    card.classList.add('suspended');
  }

  let suspensionContent = '';
  if (isSuspended) {
    if (canSeeSuspensionDetails) {
      // Show full suspension details to owner and mods
      suspensionContent = `
        <div class="suspension-notice">
          <strong>Serveur Suspendu</strong><br>
          <small>Raison: ${server.suspensionReason || 'Raison non spécifiée'}</small><br>
          <small>Par: ${server.suspendedBy || 'Administrateur'}</small>
        </div>
      `;
      if (isOwner) {
        suspensionContent += `<button class="btn btn-warning appeal-btn" data-server-id="${server.id}">Faire appel</button>`;
      }
    } else {
      // Hide details from regular users
      suspensionContent = `
        <div class="suspension-notice">
          <strong>Serveur Suspendu</strong><br>
          <small>Ce serveur a été temporairement suspendu.</small>
        </div>
      `;
    }
  }

  card.innerHTML = `
    ${server.banner ? `<img src="${server.banner}" alt="${server.name}" class="server-banner" data-image-type="banner" onerror="handleImageError(this, true)">` : ''}
    ${isSuspended ? `<div class="suspension-badge">SUSPENDU</div>` : ''}
    <div class="server-info">
      <h3>${server.name}</h3>
      <p class="server-description">${server.description || 'Aucune description disponible.'}</p>
      <div class="server-rating">
        ${server.averageRating ? `<div class="rating-stars">${generateStars(server.averageRating)} <span>(${server.totalRatings})</span></div>` : ''}
      </div>
      <div class="server-tags">
        ${server.category ? `<span class="tag category-tag">${getCategoryIcon(server.category)} ${getCategoryName(server.category)}</span>` : ''}
        ${server.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
        ${server.tags.length > 2 ? `<span class="tag">+${server.tags.length - 2}</span>` : ''}
      </div>
      <div class="server-meta">
        <span>${server.memberCount} membres</span>
        <span class="activity-badge ${activityClass}">${server.activityLevel}</span>
      </div>
      ${isSuspended ? suspensionContent : `
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-primary join-btn" style="flex: 1;">Voir</button>
          <button class="btn btn-secondary favorite-btn" data-server-id="${server.id}" title="Ajouter aux favoris" style="flex: 0.2; padding: 0; min-width: 40px;">❤️</button>
          ${user ? `<button class="btn btn-secondary rate-btn" data-server-id="${server.id}" data-server-name="${server.name}" style="flex: 1;">⭐ Noter</button>` : ''}
        </div>
      `}
    </div>
    ${isOwner && !isSuspended ? `<button class="btn btn-secondary edit-server-btn" data-server-id="${server.id}">Modifier</button>` : ''}
  `;

  // Ajouter les événements pour les boutons Noter
  const rateBtn = card.querySelector('.rate-btn');
  if (rateBtn) {
    rateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const serverId = e.target.dataset.serverId;
      const serverName = e.target.dataset.serverName;
      openServerRatingModal(serverId, serverName, user);
    });
  }

  // Ajouter l'événement pour le bouton Favori
  const favoriteBtn = card.querySelector('.favorite-btn');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      toggleFavorite(server.id, server.name, favoriteBtn);
    });
  }

  // Vérifier si le serveur est en favori et mettre à jour le bouton
  if (currentUser && favoriteBtn) {
    checkIfFavorite(server.id, favoriteBtn);
  }

  // Ajouter l'événement de clic pour ouvrir les détails (mais pas si suspendu)
  if (!isSuspended) {
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
  } else if (isOwner) {
    // Add appeal button event listener
    const appealBtn = card.querySelector('.appeal-btn');
    if (appealBtn) {
      appealBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openAppealModal(server);
      });
    }
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
        ${server.banner ? `<img src="${server.banner}" alt="${server.name}" class="server-detail-banner" data-image-type="banner" onerror="handleImageError(this, true)">` : ''}
        ${server.icon ? `<img src="${server.icon}" alt="${server.name} icon" class="server-detail-icon" data-image-type="icon" onerror="handleImageError(this, false)">` : ''}
        
        <div class="server-rating-section">
          <div class="rating-display">
            ${server.averageRating ? `<div class="rating-stars">${generateStars(server.averageRating)} <span class="rating-score">${server.averageRating}/5</span> <span class="rating-count">(${server.totalRatings} avis)</span></div>` : '<div class="no-rating">Aucun avis</div>'}
          </div>
        </div>
        
        <div class="server-details-grid">
          <div class="detail-item">
            <strong>Catégorie:</strong> ${getCategoryIcon(server.category)} ${getCategoryName(server.category)}
          </div>
          <div class="detail-item">
            <strong>Membres:</strong> ${server.memberCount}
          </div>
          <div class="detail-item">
            <strong>Langue:</strong> ${server.language || 'Non spécifiée'}
          </div>
          <div class="detail-item">
            <strong>Région:</strong> ${server.region || 'Non spécifiée'}
          </div>
        </div>
        
        <div class="server-description">
          <h4><i data-lucide="book"></i>Description</h4>
          <p>${server.description || 'Aucune description disponible.'}</p>
        </div>
        
        <div class="server-tags-detail">
          <h4><i data-lucide="tag"></i>Tags</h4>
          <div class="tags-container">
            ${server.tags && server.tags.length > 0 ? server.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : '<span class="tag">Aucun tag</span>'}
          </div>
        </div>
        
        <div class="reviews-section" id="reviews-section">
          <h4><i data-lucide="message-square"></i>Avis et commentaires</h4>
          <div id="reviews-list"></div>
          ${user ? '<button class="btn btn-secondary" id="add-review-btn">Ajouter un avis</button>' : ''}
        </div>
        
        <div class="server-actions">
          <a href="${server.inviteLink}" class="btn btn-primary" target="_blank">Rejoindre le serveur</a>
          ${user ? `<button class="btn" id="favorite-btn">Ajouter aux favoris</button>` : ''}
          ${isOwner ? `<button class="btn btn-secondary edit-server-btn" data-server-id="${server.id}">Modifier</button>` : ''}
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Initialize Lucide icons in the modal
  if (typeof lucide !== 'undefined' && lucide && lucide.createIcons) {
    lucide.createIcons();
  }

  // Fermer le modal
  const closeBtn = modal.querySelector('.modal-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.remove());
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Touche Échap pour fermer
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Bouton modifier
  if (isOwner) {
    const editBtn = modal.querySelector('.edit-server-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        modal.remove();
        editServer(server.id);
      });
    }
  }

  // Bouton favoris
  const favoriteBtn = modal.querySelector('#favorite-btn');
  if (favoriteBtn) {
    favoriteBtn.addEventListener('click', () => toggleFavorite(server.id));
  }

  // Bouton ajouter avis
  const addReviewBtn = modal.querySelector('#add-review-btn');
  if (addReviewBtn) {
    addReviewBtn.addEventListener('click', () => showAddReviewModal(server.id));
  }

  // Charger les avis
  loadReviews(server.id);
}

function editServer(serverId) {
  // Rediriger vers la page d'édition avec l'ID du serveur
  window.location.href = `edit-server.html?id=${serverId}`;
}

function filterServers() {
  const searchTerm = document.getElementById('search').value.toLowerCase();
  const categoryFilter = document.getElementById('category-filter').value;
  const languageFilter = document.getElementById('language-filter').value;
  const regionFilter = document.getElementById('region-filter').value;
  const membersFilter = document.getElementById('members-filter').value;
  const sortFilter = document.getElementById('sort-filter').value;

  // Filtrer les serveurs
  let filteredServers = allServers.filter(server => {
    // Recherche par nom
    const matchesSearch = server.name.toLowerCase().includes(searchTerm) || 
                         (server.description && server.description.toLowerCase().includes(searchTerm));
    
    // Filtre catégorie
    const matchesCategory = !categoryFilter || server.category === categoryFilter;
    
    // Filtre langue
    const matchesLanguage = !languageFilter || server.language === languageFilter;
    
    // Filtre région
    const matchesRegion = !regionFilter || server.region === regionFilter;
    
    // Filtre membres
    let matchesMembers = true;
    if (membersFilter) {
      const memberCount = server.memberCount;
      switch(membersFilter) {
        case '0-100': matchesMembers = memberCount <= 100; break;
        case '100-500': matchesMembers = memberCount > 100 && memberCount <= 500; break;
        case '500-1000': matchesMembers = memberCount > 500 && memberCount <= 1000; break;
        case '1000-5000': matchesMembers = memberCount > 1000 && memberCount <= 5000; break;
        case '5000+': matchesMembers = memberCount > 5000; break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesLanguage && matchesRegion && matchesMembers;
  });

  // Tri
  if (sortFilter) {
    switch(sortFilter) {
      case 'rating':
        filteredServers.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'members':
        filteredServers.sort((a, b) => b.memberCount - a.memberCount);
        break;
      case 'newest':
        filteredServers.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
    }
  }

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
  document.getElementById('search').value = '';
  document.getElementById('category-filter').value = '';
  document.getElementById('language-filter').value = '';
  document.getElementById('region-filter').value = '';
  document.getElementById('members-filter').value = '';
  document.getElementById('sort-filter').value = '';
  filterServers();
  closeFilterModal();
}

// === APPEAL SYSTEM ===

let currentAppealServer = null;

function openAppealModal(server) {
  currentAppealServer = server;
  const modal = document.getElementById('appeal-modal');
  const closeBtn = document.getElementById('close-appeal-modal');
  const form = document.getElementById('appeal-form');

  modal.style.display = 'flex';

  // Close modal
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    form.reset();
  });

  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      form.reset();
    }
  });

  // Handle form submission
  form.addEventListener('submit', submitAppeal);
}

async function submitAppeal(e) {
  e.preventDefault();

  if (!currentAppealServer) {
    alert('Erreur: Serveur non trouvé');
    return;
  }

  const explanation = document.getElementById('appeal-explanation').value;

  if (!explanation.trim()) {
    alert('Veuillez fournir une explication');
    return;
  }

  try {
    const response = await fetch('/api/appeals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serverId: currentAppealServer.id,
        explanation: explanation
      })
    });

    if (response.ok) {
      const appeal = await response.json();
      alert('Votre appel a été soumis avec succès. Les administrateurs l\'examineront.');
      document.getElementById('appeal-form').reset();
      document.getElementById('appeal-modal').style.display = 'none';
      currentAppealServer = null;
    } else {
      const error = await response.json();
      alert(`Erreur: ${error.error}`);
    }
  } catch (error) {
    console.error('Error submitting appeal:', error);
    alert('Erreur lors de la soumission de l\'appel');
  }
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  } catch (error) {
    console.error('Error logging out:', error);
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

async function loadAnnouncements() {
  try {
    const response = await fetch('/api/announcements');
    const announcements = await response.json();
    const banner = document.getElementById('announcements-banner');
    if (banner && announcements.length > 0) {
      banner.innerHTML = announcements.map(a => `<div class="announcement-banner">📢 Annonce: ${a.title} - ${a.message}</div>`).join('');
      banner.style.display = 'block';
    }
  } catch (error) {
    console.error('Error loading announcements:', error);
  }
}

// === RATINGS AND REVIEWS ===
async function loadUserRating(serverId, userId) {
  try {
    const response = await fetch(`/api/ratings/user/${userId}/server/${serverId}`);
    if (response.ok) {
      const rating = await response.json();
      displayRatingInput(serverId, rating);
    }
  } catch (error) {
    console.error('Error loading user rating:', error);
  }
}

function displayRatingInput(serverId, existingRating = null) {
  const container = document.getElementById('rating-input');
  if (!container) return;

  const currentRating = existingRating ? existingRating.rating : 0;
  
  container.innerHTML = `
    <div class="rating-input-group">
      <label>Votre note:</label>
      <div class="star-rating">
        ${[1,2,3,4,5].map(star => `
          <span class="star ${star <= currentRating ? 'active' : ''}" data-rating="${star}">★</span>
        `).join('')}
      </div>
      <button class="btn btn-small" id="submit-rating">Noter</button>
    </div>
  `;

  // Add click handlers
  container.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.rating);
      container.querySelectorAll('.star').forEach((s, i) => {
        s.classList.toggle('active', i < rating);
      });
      container.dataset.selectedRating = rating;
    });
  });

  // Submit rating
  document.getElementById('submit-rating').addEventListener('click', async () => {
    const rating = container.dataset.selectedRating;
    if (!rating) return;

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, rating: parseInt(rating) })
      });

      if (response.ok) {
        alert('Note enregistrée !');
        loadServers(); // Refresh to update average
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  });
}

async function loadReviews(serverId) {
  try {
    const response = await fetch(`/api/reviews/server/${serverId}`);
    const reviews = await response.json();
    
    const container = document.getElementById('reviews-list');
    if (!container) return;

    if (reviews.length === 0) {
      container.innerHTML = '<p>Aucun avis pour le moment.</p>';
      return;
    }

    container.innerHTML = reviews.map(review => `
      <div class="review-item">
        <div class="review-header">
          <div class="review-stars">${generateStars(review.rating)}</div>
          <div class="review-date">${new Date(review.createdAt).toLocaleDateString('fr-FR')}</div>
        </div>
        <div class="review-comment">${review.comment}</div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Error loading reviews:', error);
  }
}

function showAddReviewModal(serverId) {
  let selectedRating = 0;

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <div class="modal-header">
        <h3>✏️ Ajouter un avis</h3>
        <button class="modal-close" style="cursor: pointer;">&times;</button>
      </div>
      <div class="modal-body">
        <form id="review-form-${serverId}">
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">⭐ Note:</label>
            <div class="star-rating" id="review-stars-${serverId}" style="display: flex; gap: 0.5rem; font-size: 2.5rem;">
              ${[1,2,3,4,5].map(star => `<span class="star" data-rating="${star}" style="cursor: pointer; color: #cbd5e1; transition: color 0.2s;">★</span>`).join('')}
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 1.5rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">💬 Commentaire:</label>
            <textarea id="review-comment-${serverId}" placeholder="Partagez votre expérience du serveur..." required style="width: 100%; padding: 0.75rem; border: 2px solid #e2e8f0; border-radius: 8px; font-family: 'Poppins', sans-serif; resize: vertical; min-height: 120px;"></textarea>
          </div>
          <div style="display: flex; gap: 1rem;">
            <button type="submit" class="btn btn-primary" style="flex: 1;">📤 Publier l'avis</button>
            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="this.closest('.modal-overlay').remove();">Annuler</button>
          </div>
          <div id="review-error-${serverId}" style="color: #dc2626; margin-top: 1rem; display: none;"></div>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Star rating interaction
  const starsContainer = modal.querySelector(`#review-stars-${serverId}`);
  const stars = starsContainer.querySelectorAll('.star');
  
  stars.forEach(star => {
    star.addEventListener('click', () => {
      selectedRating = parseInt(star.dataset.rating);
      stars.forEach((s, i) => {
        if (i < selectedRating) {
          s.style.color = '#fbbf24';
        } else {
          s.style.color = '#cbd5e1';
        }
      });
    });
    
    star.addEventListener('mouseover', () => {
      const hoverRating = parseInt(star.dataset.rating);
      stars.forEach((s, i) => {
        s.style.color = i < hoverRating ? '#fbbf24' : '#cbd5e1';
      });
    });
  });

  starsContainer.addEventListener('mouseleave', () => {
    stars.forEach((s, i) => {
      s.style.color = i < selectedRating ? '#fbbf24' : '#cbd5e1';
    });
  });

  // Form submission
  const form = modal.querySelector(`#review-form-${serverId}`);
  const textarea = modal.querySelector(`#review-comment-${serverId}`);
  const errorDiv = modal.querySelector(`#review-error-${serverId}`);
  const submitBtn = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const comment = textarea.value.trim();

    if (!selectedRating || !comment) {
      errorDiv.textContent = '❌ Veuillez sélectionner une note et écrire un commentaire';
      errorDiv.style.display = 'block';
      return;
    }

    errorDiv.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Envoi...';

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId, rating: selectedRating, comment })
      });

      if (response.ok) {
        errorDiv.textContent = '✅ Avis soumis avec succès !';
        errorDiv.style.color = '#16a34a';
        errorDiv.style.display = 'block';
        
        setTimeout(() => {
          modal.remove();
          loadReviews(serverId);
        }, 1500);
      } else {
        const error = await response.json();
        errorDiv.textContent = '❌ ' + (error.message || 'Erreur lors de la soumission');
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = '📤 Publier l\'avis';
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      errorDiv.textContent = '❌ Erreur réseau';
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = '📤 Publier l\'avis';
    }
  });

  // Close modal
  const closeBtn = modal.querySelector('.modal-close');
  closeBtn.addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// === FAVORITES ===
async function loadFavoriteStatus(serverId) {
  try {
    const response = await fetch(`/api/favorites/check/${serverId}`);
    const data = await response.json();
    
    const btn = document.getElementById('favorite-btn');
    if (btn) {
      btn.textContent = data.favorited ? '❤️ Retirer des favoris' : '🤍 Ajouter aux favoris';
      btn.dataset.favorited = data.favorited;
    }
  } catch (error) {
    console.error('Error loading favorite status:', error);
  }
}

async function toggleFavorite(serverId) {
  const btn = document.getElementById('favorite-btn');
  const isFavorited = btn.dataset.favorited === 'true';

  try {
    const response = await fetch(`/api/favorites${isFavorited ? `/${serverId}` : ''}`, {
      method: isFavorited ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: isFavorited ? null : JSON.stringify({ serverId })
    });

    if (response.ok) {
      btn.dataset.favorited = !isFavorited;
      btn.textContent = !isFavorited ? '❤️ Retirer des favoris' : '🤍 Ajouter aux favoris';
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
  }
}

// === SYSTÈME DE NOTATION ===
function openServerRatingModal(serverId, serverName, user) {
  if (!user) {
    alert('Veuillez vous connecter pour noter');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  let currentRating = 0;

  modal.innerHTML = `
    <div class="modal-content" style="max-width: 450px;">
      <div class="modal-header">
        <h2>Noter: ${serverName}</h2>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body" style="text-align: center;">
        <p style="color: #666; margin-bottom: 1.5rem;">Évaluez votre expérience (1-5 étoiles)</p>
        <div id="rating-stars" style="font-size: 3rem; display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem;">
          <span class="star" data-rating="1" style="cursor: pointer; color: #d1d5db; transition: all 0.2s; user-select: none;">★</span>
          <span class="star" data-rating="2" style="cursor: pointer; color: #d1d5db; transition: all 0.2s; user-select: none;">★</span>
          <span class="star" data-rating="3" style="cursor: pointer; color: #d1d5db; transition: all 0.2s; user-select: none;">★</span>
          <span class="star" data-rating="4" style="cursor: pointer; color: #d1d5db; transition: all 0.2s; user-select: none;">★</span>
          <span class="star" data-rating="5" style="cursor: pointer; color: #d1d5db; transition: all 0.2s; user-select: none;">★</span>
        </div>
        <p id="rating-text" style="color: #3b82f6; font-size: 1.1rem; margin: 1rem 0; min-height: 1.5rem; font-weight: 600;"></p>
        <div style="margin: 1.5rem 0;">
          <textarea id="rating-comment" placeholder="Partager votre avis (optionnel)" style="width: 100%; padding: 0.75rem; border-radius: 6px; border: 1px solid #e5e7eb; background: #f9fafb; color: #1f2937; font-family: inherit; min-height: 100px; resize: vertical; font-size: 0.95rem;"></textarea>
        </div>
        <div style="display: flex; gap: 1rem;">
          <button class="btn btn-primary" style="flex: 1;">Envoyer</button>
          <button class="btn btn-secondary" style="flex: 1;">Annuler</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.modal-close');
  const submitBtn = modal.querySelector('.btn-primary');
  const cancelBtn = modal.querySelector('.btn-secondary');
  const stars = modal.querySelectorAll('.star');
  const ratingText = document.getElementById('rating-text');

  const updateStars = () => {
    stars.forEach((s, i) => {
      s.style.color = i < currentRating ? '#fbbf24' : '#d1d5db';
    });
    const ratings = ['', 'Mauvais', 'Moyen', 'Bon', 'Très bon', 'Excellent'];
    ratingText.textContent = currentRating > 0 ? ratings[currentRating] : '';
  };

  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      currentRating = parseInt(e.target.dataset.rating);
      updateStars();
    });

    star.addEventListener('mouseover', (e) => {
      const rating = parseInt(e.target.dataset.rating);
      stars.forEach((s, i) => {
        s.style.color = i < rating ? '#fbbf24' : '#d1d5db';
      });
    });
  });

  modal.addEventListener('mouseout', (e) => {
    if (e.target.closest('#rating-stars')) {
      updateStars();
    }
  });

  closeBtn.addEventListener('click', () => modal.remove());
  cancelBtn.addEventListener('click', () => modal.remove());

  submitBtn.addEventListener('click', async () => {
    if (!currentRating) {
      alert('Veuillez sélectionner une note');
      return;
    }

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serverId: serverId,
          rating: currentRating,
          comment: document.getElementById('rating-comment').value
        })
      });

      if (response.ok) {
        alert('Avis enregistré avec succès!');
        modal.remove();
        loadServers();
      } else {
        alert('Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert('Erreur lors de l\'enregistrement');
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
// Favorites Management Functions
async function checkIfFavorite(serverId, button) {
  try {
    const response = await fetch('/api/favorites');
    const favorites = await response.json();
    const isFavorite = favorites.some(fav => fav.serverId === serverId);
    if (isFavorite) {
      button.style.color = '#ef4444';
      button.textContent = '??';
    } else {
      button.style.color = 'inherit';
      button.textContent = '??';
    }
  } catch (error) {
    console.error('Error checking favorite:', error);
  }
}

async function toggleFavorite(serverId, serverName, button) {
  try {
    if (!button) {
      console.error('Button element is null');
      return;
    }
    
    const response = await fetch('/api/favorites');
    const favorites = await response.json();
    const isFavorite = favorites.some(fav => fav.serverId === serverId);

    if (isFavorite) {
      const deleteResponse = await fetch(`/api/favorites/${serverId}`, {
        method: 'DELETE'
      });
      if (deleteResponse.ok) {
        button.style.color = 'inherit';
        alert(`${serverName} a été retiré de vos favoris`);
      }
    } else {
      const postResponse = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverId })
      });
      if (postResponse.ok) {
        button.style.color = '#ef4444';
        alert(`${serverName} a été ajouté à vos favoris`);
      }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    alert('Erreur lors de la modification des favoris');
  }
}
