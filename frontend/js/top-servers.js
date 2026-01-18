// top-servers.js
const API_BASE = 'http://localhost:3000/api';
// Note: allServers is already declared in app.js, removed duplicate here
let currentSortType = 'rating';
// Note: currentUser is already declared in app.js, removed duplicate here
let selectedServerId = null;
let selectedRating = 0;

document.addEventListener('DOMContentLoaded', () => {
  checkUserAuth();
  loadAllServers();
  setupSortButtons();
  setupRatingModal();
});

// Vérifier l'authentification
async function checkUserAuth() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`);
    if (response.ok) {
      currentUser = await response.json();
      document.getElementById('profile-dropdown').style.display = 'flex';
      document.getElementById('login-link').style.display = 'none';
    } else {
      document.getElementById('login-link').style.display = 'block';
      document.getElementById('profile-dropdown').style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking auth:', error);
  }
}

// Charger tous les serveurs
async function loadAllServers() {
  try {
    const response = await fetch(`${API_BASE}/servers?status=approved`);
    if (response.ok) {
      allServers = await response.json();
      sortAndDisplay('rating');
    } else {
      document.getElementById('servers-list').innerHTML = '<div class="no-servers">Aucun serveur approuvé pour le moment.</div>';
    }
  } catch (error) {
    console.error('Error loading servers:', error);
    document.getElementById('servers-list').innerHTML = '<div class="no-servers">Erreur lors du chargement des serveurs.</div>';
  }
}

// Configuration des boutons de tri
function setupSortButtons() {
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentSortType = btn.dataset.sort;
      sortAndDisplay(currentSortType);
    });
  });
}

// Trier et afficher les serveurs
function sortAndDisplay(sortType) {
  let sorted = [...allServers];

  switch(sortType) {
    case 'rating':
      sorted.sort((a, b) => {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      });
      break;
    case 'members':
      sorted.sort((a, b) => {
        const membersA = parseInt(a.memberCount) || 0;
        const membersB = parseInt(b.memberCount) || 0;
        return membersB - membersA;
      });
      break;
    case 'trend':
      // Simuler la tendance : serveurs avec plus de ratings récents en haut
      sorted.sort((a, b) => {
        const countA = a.totalRatings || 0;
        const countB = b.totalRatings || 0;
        return countB - countA;
      });
      break;
  }

  displayServers(sorted);
}

// Afficher les serveurs
function displayServers(servers) {
  const list = document.getElementById('servers-list');
  
  if (servers.length === 0) {
    list.innerHTML = '<div class="no-servers">Aucun serveur à afficher.</div>';
    return;
  }

  list.innerHTML = servers.map((server, index) => {
    const rank = index + 1;
    const avgRating = server.averageRating || 0;
    const totalRatings = server.totalRatings || 0;
    const stars = generateStars(avgRating);
    
    let rankClass = '';
    if (rank === 1) rankClass = 'first';
    else if (rank === 2) rankClass = 'second';
    else if (rank === 3) rankClass = 'third';

    return `
      <div class="server-rank-card">
        <div class="rank-badge ${rankClass}">
          ${rank <= 10 ? rank : '✨'}
        </div>
        <div class="server-info">
          <div class="server-header">
            <img src="${server.icon || '/asset/default-icon.png'}" alt="${server.name}" class="server-icon" onerror="this.src='/asset/default-icon.png'">
            <h3 class="server-name">${escapeHtml(server.name)}</h3>
            <span class="server-category">${escapeHtml(server.category || 'Général')}</span>
          </div>
          
          <div class="server-stats">
            <div class="stat-item">
              <span class="stat-icon">👥</span>
              <span><span class="stat-value">${formatNumber(server.memberCount)}</span> membres</span>
            </div>
            <div class="stat-item">
              <span class="rating-display">
                <span class="stars">${stars}</span>
                <span class="stat-value">${avgRating.toFixed(1)}</span>
                <span style="color: #b0b0b0;">/ 5</span>
              </span>
              <span style="color: #b0b0b0;">(${totalRatings} avis)</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">📝</span>
              <span>${escapeHtml(server.language || 'Français')}</span>
            </div>
          </div>

          <p class="server-description">${escapeHtml(server.description || 'Pas de description')}</p>

          <div class="server-actions">
            <a href="${escapeHtml(server.inviteLink)}" target="_blank" class="btn-visit">👉 Rejoindre</a>
            ${currentUser ? `<button class="btn-rate" onclick="openRatingModal('${server.id}', '${escapeHtml(server.name)}')">⭐ Noter</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Générer les étoiles
function generateStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 !== 0;
  let stars = '';
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars += '★';
    } else if (i === fullStars && hasHalf) {
      stars += '◐';
    } else {
      stars += '☆';
    }
  }
  
  return stars;
}

// Modal pour noter
function setupRatingModal() {
  const stars = document.querySelectorAll('#modal-stars .star');
  
  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      selectedRating = parseInt(e.target.dataset.rating);
      updateStarDisplay();
    });
    
    star.addEventListener('mouseover', (e) => {
      const rating = parseInt(e.target.dataset.rating);
      stars.forEach((s, i) => {
        s.style.color = i < rating ? '#ffd700' : '#666';
      });
    });
  });

  document.getElementById('modal-stars').addEventListener('mouseout', updateStarDisplay);
}

function updateStarDisplay() {
  const stars = document.querySelectorAll('#modal-stars .star');
  const ratingText = document.getElementById('rating-text');
  
  stars.forEach((s, i) => {
    s.style.color = i < selectedRating ? '#ffd700' : '#666';
  });

  const ratings = ['', 'Mauvais', 'Moyen', 'Bon', 'Très bon', 'Excellent'];
  ratingText.textContent = selectedRating > 0 ? ratings[selectedRating] : '';
}

function openRatingModal(serverId, serverName) {
  selectedServerId = serverId;
  selectedRating = 0;
  document.getElementById('modal-server-name').textContent = `Évaluer: ${serverName}`;
  document.getElementById('review-text').value = '';
  updateStarDisplay();
  document.getElementById('rating-modal').style.display = 'flex';
}

function closeRatingModal() {
  document.getElementById('rating-modal').style.display = 'none';
  selectedServerId = null;
  selectedRating = 0;
}

async function submitRating() {
  if (!selectedRating) {
    alert('Veuillez sélectionner une note');
    return;
  }

  if (!currentUser) {
    alert('Vous devez être connecté pour noter');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/ratings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        serverId: selectedServerId,
        rating: selectedRating
      })
    });

    if (response.ok) {
      alert('Avis enregistré avec succès!');
      loadAllServers();
      closeRatingModal();
    } else {
      alert('Erreur lors de l\'enregistrement de l\'avis');
    }
  } catch (error) {
    console.error('Error submitting rating:', error);
    alert('Erreur lors de l\'enregistrement de l\'avis');
  }
}

// Utilitaires
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// Fermer le modal en cliquant en dehors
document.addEventListener('click', (e) => {
  const modal = document.getElementById('rating-modal');
  if (e.target === modal) {
    closeRatingModal();
  }
});
