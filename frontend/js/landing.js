// landing.js

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('enter-site').addEventListener('click', () => window.location.href = 'index.html');
  document.getElementById('explore-btn').addEventListener('click', () => window.location.href = 'index.html');
  document.getElementById('login-link').addEventListener('click', () => window.location.href = 'login.html');
}

async function loadStats() {
  try {
    const statsResponse = await fetch('/api/servers/stats');
    const stats = await statsResponse.json();

    document.getElementById('total-servers').textContent = stats.totalServers.toLocaleString();
    document.getElementById('total-users').textContent = stats.totalUsers.toLocaleString();
    document.getElementById('total-members').textContent = stats.totalMembers.toLocaleString();
    document.getElementById('total-reviews').textContent = stats.totalReviews.toLocaleString();

  } catch (error) {
    console.error('Error loading stats:', error);
    // Valeurs par défaut en cas d'erreur
    document.getElementById('total-servers').textContent = '3';
    document.getElementById('total-users').textContent = '4';
    document.getElementById('total-members').textContent = '2,100';
    document.getElementById('total-reviews').textContent = '0';
  }
}