// Image fallback management
const DEFAULT_BANNER = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22200%22%3E%3Crect fill=%226366f1%22 width=%22400%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EServeur Discord%3C/text%3E%3C/svg%3E';
const DEFAULT_ICON = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2250%22 fill=%236366f1%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2240%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E%F0%9F%8E%AE%3C/text%3E%3C/svg%3E';

// Handle image load errors with fallback
function handleImageError(img, isBanner = false) {
  img.onerror = null; // Prevent infinite loop
  img.src = isBanner ? DEFAULT_BANNER : DEFAULT_ICON;
  img.style.display = 'block';
}

// Set fallback images for all server images
function setImageFallbacks() {
  document.querySelectorAll('[data-image-type="banner"]').forEach(img => {
    img.onerror = () => handleImageError(img, true);
    // Test if image loads, if not set fallback
    if (!img.complete || img.naturalHeight === 0) {
      handleImageError(img, true);
    }
  });

  document.querySelectorAll('[data-image-type="icon"]').forEach(img => {
    img.onerror = () => handleImageError(img, false);
    if (!img.complete || img.naturalHeight === 0) {
      handleImageError(img, false);
    }
  });
}

// Call this after DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setImageFallbacks);
} else {
  setImageFallbacks();
}
