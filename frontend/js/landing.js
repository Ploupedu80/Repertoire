// landing.js

document.addEventListener('DOMContentLoaded', () => {
  checkUserAuth();
  loadStats();
  loadPartners();
  setupEventListeners();
  initScrollAnimations();
  initParallaxEffect();
});

function setupEventListeners() {
  document.getElementById('enter-site').addEventListener('click', () => window.location.href = 'index.html');
  document.getElementById('explore-btn').addEventListener('click', () => window.location.href = 'index.html');
  document.getElementById('login-link').addEventListener('click', () => window.location.href = 'login.html');
  
  // Ajouter l'événement pour le bouton d'avis
  const addReviewBtn = document.getElementById('add-review-btn');
  if (addReviewBtn) {
    addReviewBtn.addEventListener('click', openAddReviewModal);
  }
  
  // Gérer le modal
  const modal = document.getElementById('review-modal');
  const closeBtn = document.querySelector('.close-modal');
  const reviewForm = document.getElementById('review-form');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', closeReviewModal);
  }
  
  if (modal) {
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeReviewModal();
      }
    });
  }
  
  if (reviewForm) {
    reviewForm.addEventListener('submit', submitReview);
  }
  
  // Gérer les étoiles
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => {
    star.addEventListener('click', selectStar);
    star.addEventListener('mouseover', hoverStar);
  });
  
  const starRating = document.getElementById('star-rating');
  if (starRating) {
    starRating.addEventListener('mouseleave', resetStars);
  }
}

async function checkUserAuth() {
  try {
    const response = await fetch('/api/auth/me').catch(() => null);
    
    if (response && response.ok) {
      // L'utilisateur est connecté
      const loginLink = document.getElementById('login-link');
      if (loginLink) {
        loginLink.style.display = 'none';
      }
    }
  } catch (error) {
    console.log('Utilisateur non connecté ou erreur de vérification');
  }
}

async function loadStats() {
  try {
    const statsResponse = await fetch('/api/servers/stats');
    const stats = await statsResponse.json();

    if (document.getElementById('total-servers')) animateCounter('total-servers', 0, stats.totalServers, 2000);
    if (document.getElementById('total-users')) animateCounter('total-users', 0, stats.totalUsers, 2000);
    if (document.getElementById('total-members')) animateCounter('total-members', 0, stats.totalMembers, 2000);
    if (document.getElementById('total-reviews')) animateCounter('total-reviews', 0, stats.totalReviews, 2000);

  } catch (error) {
    console.error('Error loading stats:', error);
    // Valeurs par défaut en cas d'erreur
    animateCounter('total-servers', 0, 3, 1000);
    animateCounter('total-users', 0, 4, 1000);
    animateCounter('total-members', 0, 2100, 1000);
    animateCounter('total-reviews', 0, 0, 1000);
  }
}

async function loadPartners() {
  try {
    const response = await fetch('/api/partners');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const partners = await response.json();
    displayPartners(partners);
  } catch (error) {
    console.error('Error loading partners:', error);
    // Afficher un message ou rien si pas de partenaires
    const grid = document.getElementById('partners-grid');
    if (grid) {
      grid.innerHTML = '<p style="text-align: center; color: #64748b; grid-column: 1/-1;">Aucun partenaire pour le moment</p>';
    }
  }
}

function displayPartners(partners) {
  const grid = document.getElementById('partners-grid');
  if (!grid) return;

  grid.innerHTML = '';

  if (partners.length === 0) {
    grid.innerHTML = '<p style="text-align: center; color: #64748b; grid-column: 1/-1;">Aucun partenaire pour le moment</p>';
    return;
  }

  partners.forEach((partner, index) => {
    const card = document.createElement('div');
    card.className = 'partner-card fade-in-scale';
    card.style.setProperty('--stagger-delay', `${index * 50}ms`);
    card.dataset.partnerId = partner.id;
    card.dataset.partnerName = partner.name;
    card.dataset.externalLink = partner.externalLink || '';
    
    card.innerHTML = `
      <img src="${partner.image}" alt="${partner.name}" class="partner-logo-img" style="width: 120px; height: 120px; object-fit: contain; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); margin-right: 2rem; flex-shrink: 0;">
      <h4 class="partner-title" style="margin: 0 1rem 0 0; font-size: 1.8rem; color: #1f2937; font-weight: 800; transition: color 0.3s ease; flex-shrink: 0;">${partner.name}</h4>
      <p class="partner-description" style="margin: 0; color: #6b7280; font-size: 1rem; line-height: 1.7; flex: 1;">${partner.description}</p>
    `;
    
    // Ajouter l'événement de clic
    card.addEventListener('click', () => handlePartnerClick(partner));
    
    grid.appendChild(card);
  });

  // Re-initialize scroll animations for newly added elements
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-scale');
      }
    });
  }, observerOptions);

  document.querySelectorAll('.partner-card').forEach(item => {
    observer.observe(item);
  });
}

function animateCounter(elementId, start, end, duration) {
  const element = document.getElementById(elementId);
  const startTime = performance.now();
  const endFormatted = end.toLocaleString();

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smooth animation with spring effect
    const easeOutElastic = progress === 0 
      ? 0 
      : progress === 1 
      ? 1 
      : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    
    const current = Math.floor(start + (end - start) * easeOutElastic);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      element.textContent = endFormatted;
    }
  }

  requestAnimationFrame(updateCounter);
}

function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Ajouter un délai progressif pour un effet cascade
        setTimeout(() => {
          entry.target.classList.add('fade-in-scale');
          entry.target.style.setProperty('--stagger-delay', `${index * 50}ms`);
        }, index * 80);
      }
    });
  }, observerOptions);

  // Observer les éléments à animer (stat-item uniquement, partenaires seront ajoutés dynamiquement)
  document.querySelectorAll('.stat-item').forEach(item => {
    observer.observe(item);
  });

  // Animation initiale pour la section hero
  setTimeout(() => {
    const hero = document.querySelector('.hero');
    if (hero) hero.classList.add('fade-in-scale');
  }, 300);

  // Animation pour les sections stats et partenaires
  setTimeout(() => {
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) statsSection.classList.add('slide-in-bottom');
  }, 600);

  setTimeout(() => {
    const partnersSection = document.querySelector('.partners-section');
    if (partnersSection) partnersSection.classList.add('slide-in-bottom');
  }, 900);
}

function initParallaxEffect() {
  // Subtle parallax effect on scroll
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const landingMain = document.querySelector('.landing-main');
    
    if (landingMain) {
      landingMain.style.backgroundPosition = `0 ${scrolled * 0.5}px`;
    }
  });
}

// Fonction pour ouvrir la modal d'ajout d'avis
function openAddReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeReviewModal() {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function selectStar(e) {
  const value = e.target.getAttribute('data-value');
  document.getElementById('review-rating').value = value;
  
  const stars = document.querySelectorAll('.star');
  stars.forEach((star, index) => {
    if (index < value) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function hoverStar(e) {
  const value = e.target.getAttribute('data-value');
  const stars = document.querySelectorAll('.star');
  
  stars.forEach((star, index) => {
    if (index < value) {
      star.classList.add('hover');
    } else {
      star.classList.remove('hover');
    }
  });
}

function resetStars() {
  const rating = document.getElementById('review-rating').value;
  const stars = document.querySelectorAll('.star');
  
  stars.forEach((star, index) => {
    star.classList.remove('hover');
    if (rating && index < rating) {
      star.classList.add('active');
    } else {
      star.classList.remove('active');
    }
  });
}

function submitReview(e) {
  e.preventDefault();
  
  const firstname = document.getElementById('review-firstname').value;
  const title = document.getElementById('review-title').value;
  const description = document.getElementById('review-description').value;
  const rating = document.getElementById('review-rating').value;
  
  if (!firstname || !title || !description || !rating) {
    alert('Veuillez remplir tous les champs et sélectionner des étoiles.');
    return;
  }
  
  const reviewData = {
    firstname: firstname.trim(),
    title: title,
    description: description,
    rating: parseInt(rating),
    timestamp: new Date().toISOString()
  };
  
  console.log('Avis soumis:', reviewData);
  alert(`Merci ${firstname} pour votre avis! ${rating} ⭐`);
  
  // Incrémenter le compteur d'avis
  const reviewCounter = document.getElementById('total-reviews');
  if (reviewCounter) {
    const currentValue = parseInt(reviewCounter.textContent);
    reviewCounter.textContent = currentValue + 1;
  }
  
  // Réinitialiser le formulaire
  document.getElementById('review-form').reset();
  document.getElementById('review-rating').value = '0';
  document.querySelectorAll('.star').forEach(star => star.classList.remove('active'));
  
  closeReviewModal();
}

// Variables globales pour la redirection partenaire
let currentPartnerRedirectUrl = null;

// Gestionnaire de clic sur un partenaire
function handlePartnerClick(partner) {
  // Vérifier si le lien externe est configuré
  if (!partner.externalLink || partner.externalLink.trim() === '') {
    alert(`❌ Le lien externe pour "${partner.name}" n'a pas été configuré. Veuillez contacter un administrateur.`);
    return;
  }

  // Valider que c'est une URL
  try {
    new URL(partner.externalLink);
  } catch (error) {
    alert(`❌ Le lien externe pour "${partner.name}" n'est pas valide.`);
    return;
  }

  // Afficher la modal d'avertissement
  currentPartnerRedirectUrl = partner.externalLink;
  document.getElementById('partner-redirect-name').textContent = partner.name;
  
  const modal = document.getElementById('partner-redirect-modal');
  modal.classList.add('show');
}

// Fermer la modal de redirection
function closePartnerModal() {
  const modal = document.getElementById('partner-redirect-modal');
  modal.classList.remove('show');
  currentPartnerRedirectUrl = null;
}

// Confirmer la redirection
function confirmPartnerRedirect() {
  if (currentPartnerRedirectUrl) {
    window.open(currentPartnerRedirectUrl, '_blank');
    closePartnerModal();
  }
}

// Fermer la modal en cliquant sur le bouton close
document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.querySelector('.close-partner-modal');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePartnerModal);
  }

  // Fermer en cliquant en dehors
  const modal = document.getElementById('partner-redirect-modal');
  if (modal) {
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        closePartnerModal();
      }
    });
  }
});
