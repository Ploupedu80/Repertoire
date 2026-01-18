// Gestion des cookies de consentement
document.addEventListener('DOMContentLoaded', function() {
  const cookieBanner = document.getElementById('cookie-banner');
  const acceptAllBtn = document.getElementById('accept-all-cookies');
  const rejectBtn = document.getElementById('reject-cookies');
  const customizeBtn = document.getElementById('customize-cookies');
  const savePrefBtn = document.getElementById('save-preferences');
  const cookieModal = document.getElementById('cookie-modal');
  const closeModal = document.getElementById('close-cookie-modal');

  const COOKIE_CONSENT_KEY = 'gamehub_cookie_consent';
  const COOKIE_PREFERENCES_KEY = 'gamehub_cookie_preferences';

  // Vérifier si l'utilisateur a déjà donné son consentement
  function hasCookieConsent() {
    return localStorage.getItem(COOKIE_CONSENT_KEY);
  }

  // Afficher le banneau si pas de consentement
  function initializeCookieBanner() {
    if (!hasCookieConsent()) {
      if (cookieBanner) {
        cookieBanner.style.display = 'block';
      }
    } else {
      if (cookieBanner) {
        cookieBanner.style.display = 'none';
      }
    }
  }

  // Accepter tous les cookies
  if (acceptAllBtn) {
    acceptAllBtn.addEventListener('click', function() {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({
        essential: true,
        analytics: true,
        marketing: true
      }));
      if (cookieBanner) {
        cookieBanner.style.display = 'none';
      }
      enableAnalytics();
    });
  }

  // Refuser les cookies non-essentiels
  if (rejectBtn) {
    rejectBtn.addEventListener('click', function() {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify({
        essential: true,
        analytics: false,
        marketing: false
      }));
      if (cookieBanner) {
        cookieBanner.style.display = 'none';
      }
    });
  }

  // Ouvrir le modal de personnalisation
  if (customizeBtn) {
    customizeBtn.addEventListener('click', function() {
      if (cookieModal) {
        cookieModal.style.display = 'block';
      }
    });
  }

  // Fermer le modal
  if (closeModal) {
    closeModal.addEventListener('click', function() {
      if (cookieModal) {
        cookieModal.style.display = 'none';
      }
    });
  }

  // Fermer le modal si on clique en dehors
  if (cookieModal) {
    window.addEventListener('click', function(event) {
      if (event.target === cookieModal) {
        cookieModal.style.display = 'none';
      }
    });
  }

  // Sauvegarder les préférences personnalisées
  if (savePrefBtn) {
    savePrefBtn.addEventListener('click', function() {
      const preferences = {
        essential: document.getElementById('cookie-essential').checked,
        analytics: document.getElementById('cookie-analytics').checked,
        marketing: document.getElementById('cookie-marketing').checked
      };
      localStorage.setItem(COOKIE_CONSENT_KEY, 'custom');
      localStorage.setItem(COOKIE_PREFERENCES_KEY, JSON.stringify(preferences));
      
      if (preferences.analytics) {
        enableAnalytics();
      }

      if (cookieModal) {
        cookieModal.style.display = 'none';
      }
      if (cookieBanner) {
        cookieBanner.style.display = 'none';
      }
    });
  }

  // Activer Google Analytics (ou autre service de tracking)
  function enableAnalytics() {
    // Remplacer 'GA_ID' par votre ID Google Analytics si vous en avez un
    // Exemple: window.dataLayer = window.dataLayer || [];
    // function gtag(){dataLayer.push(arguments);}
    // gtag('js', new Date());
    // gtag('config', 'GA_ID');
    console.log('Analytics activé avec consentement');
  }

  // Charger les préférences si elles existent
  function loadPreferences() {
    const prefs = localStorage.getItem(COOKIE_PREFERENCES_KEY);
    if (prefs) {
      const preferences = JSON.parse(prefs);
      if (document.getElementById('cookie-essential')) {
        document.getElementById('cookie-essential').checked = preferences.essential;
        document.getElementById('cookie-essential').disabled = true;
      }
      if (document.getElementById('cookie-analytics')) {
        document.getElementById('cookie-analytics').checked = preferences.analytics;
      }
      if (document.getElementById('cookie-marketing')) {
        document.getElementById('cookie-marketing').checked = preferences.marketing;
      }
    }
  }

  // Initialiser
  initializeCookieBanner();
  loadPreferences();
});
