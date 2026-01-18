// Theme Manager - Simple Dark/Light Mode System

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'gamehub-theme';
    this.DARK_MODE_CLASS = 'dark-mode';
    this.init();
  }

  init() {
    // Charger le thème sauvegardé ou utiliser le préférence système
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      this.setTheme(savedTheme === 'dark');
    } else if (prefersDark) {
      this.setTheme(true);
    }

    // Écouter les changements de préférence système
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches);
      }
    });
  }

  setTheme(isDark) {
    if (isDark) {
      document.body.classList.add(this.DARK_MODE_CLASS);
      localStorage.setItem(this.STORAGE_KEY, 'dark');
      this.updateToggleButtons('🌙');
    } else {
      document.body.classList.remove(this.DARK_MODE_CLASS);
      localStorage.setItem(this.STORAGE_KEY, 'light');
      this.updateToggleButtons('☀️');
    }
  }

  toggle() {
    const isDark = document.body.classList.contains(this.DARK_MODE_CLASS);
    this.setTheme(!isDark);
  }

  isDarkMode() {
    return document.body.classList.contains(this.DARK_MODE_CLASS);
  }

  updateToggleButtons(icon) {
    // Mettre à jour l'icône de tous les boutons de toggle
    document.querySelectorAll('.theme-toggle').forEach(btn => {
      btn.textContent = icon;
    });
  }
}

// Initialiser le gestionnaire de thème
let themeManager;

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    themeManager = new ThemeManager();
    setupThemeToggleButtons();
  });
} else {
  themeManager = new ThemeManager();
  setupThemeToggleButtons();
}

// Configuration des boutons de toggle
function setupThemeToggleButtons() {
  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      themeManager.toggle();
    });
  });
}

// Export pour accès global
window.themeManager = themeManager;
