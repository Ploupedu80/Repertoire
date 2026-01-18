// admin-stats.js - Statistics and Charts for Admin Dashboard

let chartInstances = {};
let currentTimePeriod = 'month';

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAccess();
  loadStatistics();
  setupTimeFilterButtons();
  document.getElementById('logout-link').addEventListener('click', logout);
});

async function checkAdminAccess() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok) {
      window.location.href = 'login.html';
      return;
    }
    const user = await response.json();
    if (!['admin', 'developer', 'moderator'].includes(user.role)) {
      window.location.href = 'index.html';
    }
  } catch (error) {
    window.location.href = 'login.html';
  }
}

async function loadStatistics() {
  try {
    const serversResponse = await fetch('/api/servers');
    const servers = await serversResponse.json();
    
    // Update KPI cards
    updateKPICards(servers);
    
    // Create charts
    createAllCharts(servers);
    
    // Display top servers
    displayTopServers(servers);
  } catch (error) {
    console.error('Error loading statistics:', error);
  }
}

function updateKPICards(servers) {
  const totalServers = servers.length;
  const totalUsers = new Set(servers.map(s => s.submittedBy)).size;
  const totalReviews = servers.reduce((sum, s) => sum + (s.totalRatings || 0), 0);
  const averageRating = servers.length > 0 ? 
    (servers.reduce((sum, s) => sum + (s.averageRating || 0), 0) / servers.length).toFixed(2) : 0;
  
  document.getElementById('kpi-servers').textContent = totalServers;
  document.getElementById('kpi-users').textContent = totalUsers;
  document.getElementById('kpi-reviews').textContent = totalReviews;
  document.getElementById('kpi-rating').textContent = averageRating;
  
  // Add some growth indicators (dummy for now)
  document.getElementById('kpi-servers-change').textContent = '+12%';
  document.getElementById('kpi-users-change').textContent = '+8%';
  document.getElementById('kpi-reviews-change').textContent = '+25%';
}

function createAllCharts(servers) {
  // Destroy existing charts
  Object.values(chartInstances).forEach(chart => {
    if (chart) chart.destroy();
  });
  chartInstances = {};
  
  createGrowthChart(servers);
  createCategoryChart(servers);
  createLanguageChart(servers);
  createRegionChart(servers);
}

function createGrowthChart(servers) {
  const ctx = document.getElementById('growth-chart')?.getContext('2d');
  if (!ctx) return;
  
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];
  const data = [150, 220, 320, 480, 580, servers.length];
  
  chartInstances.growth = new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Nombre de serveurs',
        data: data,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function createCategoryChart(servers) {
  const ctx = document.getElementById('category-chart')?.getContext('2d');
  if (!ctx) return;
  
  // Count servers by category
  const categoryCount = {};
  servers.forEach(server => {
    const cat = server.category || 'Autre';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  
  chartInstances.category = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categoryCount),
      datasets: [{
        data: Object.values(categoryCount),
        backgroundColor: colors.slice(0, Object.keys(categoryCount).length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function createLanguageChart(servers) {
  const ctx = document.getElementById('language-chart')?.getContext('2d');
  if (!ctx) return;
  
  // Count servers by language
  const languageCount = {};
  servers.forEach(server => {
    const lang = server.language || 'Français';
    languageCount[lang] = (languageCount[lang] || 0) + 1;
  });
  
  chartInstances.language = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(languageCount),
      datasets: [{
        label: 'Nombre de serveurs',
        data: Object.values(languageCount),
        backgroundColor: '#3b82f6'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

function createRegionChart(servers) {
  const ctx = document.getElementById('region-chart')?.getContext('2d');
  if (!ctx) return;
  
  // Count servers by region
  const regionCount = {};
  servers.forEach(server => {
    const region = server.region || 'Europe';
    regionCount[region] = (regionCount[region] || 0) + 1;
  });
  
  chartInstances.region = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: Object.keys(regionCount),
      datasets: [{
        label: 'Serveurs',
        data: Object.values(regionCount),
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        pointBackgroundColor: '#8b5cf6',
        pointBorderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        r: {
          beginAtZero: true
        }
      }
    }
  });
}

function displayTopServers(servers) {
  const topServersList = document.getElementById('top-servers-list');
  if (!topServersList) return;
  
  // Sort by rating and get top 10
  const topServers = servers
    .filter(s => s.averageRating && s.averageRating > 0)
    .sort((a, b) => b.averageRating - a.averageRating)
    .slice(0, 10);
  
  topServersList.innerHTML = topServers.map((server, index) => {
    const badges = ['🥇', '🥈', '🥉'];
    const badge = badges[index] || '🏅';
    
    return `
      <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: 8px; border-left: 3px solid #f59e0b;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.7;">${badge} #${index + 1}</p>
            <h4 style="margin: 0.5rem 0 0 0;">${server.name}</h4>
            <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; opacity: 0.8;">
              👥 ${server.memberCount} members • 💬 ${server.totalRatings || 0} avis
            </p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 1.5rem; font-weight: bold; color: #f59e0b;">⭐ ${server.averageRating?.toFixed(1) || 'N/A'}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupTimeFilterButtons() {
  document.querySelectorAll('.time-filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.time-filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentTimePeriod = e.target.dataset.period;
      loadStatistics();
    });
  });
}

function setupTimeFilterStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .time-filter-btn {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .time-filter-btn:hover {
      background: var(--bg-tertiary);
    }
    .time-filter-btn.active {
      background: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }
  `;
  document.head.appendChild(style);
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = 'landing.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', setupTimeFilterStyles);
