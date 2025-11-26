/**
 * Language Manager
 * Handles language detection, switching, and translation loading
 */

class LanguageManager {
  constructor() {
    this.STORAGE_KEY = 'preferredLanguage';
    this.currentLanguage = 'fr'; // Default language
    this.translations = null;
    this.translationsLoaded = false;
  }

  /**
   * Initialize the language manager
   */
  async init() {
    this.detectLanguageFromUrl();
    await this.loadTranslations();
    this.applyTranslations();
    return this;
  }

  /**
   * Detect language from current URL filename
   * Example: index-en.html -> 'en', index.html -> 'fr'
   */
  detectLanguageFromUrl() {
    const path = window.location.pathname;
    let filename = path.split('/').pop();
    
    if (!filename || filename === '/') {
      // Normalize root path to homepage filename
      filename = 'index.html';
      console.debug('[LanguageManager] Empty path detected, defaulting to index.html');
    }
    
    // Check if filename contains -en
    if (filename.includes('-en.html')) {
      this.currentLanguage = 'en';
    } else {
      this.currentLanguage = 'fr';
    }
    
    // Store preference
    this.saveLanguagePreference(this.currentLanguage);
    
    return this.currentLanguage;
  }

  /**
   * Load translations from JSON file
   */
  async loadTranslations() {
    if (this.translationsLoaded && this.translations) {
      return this.translations;
    }

    try {
      const response = await fetch('/translations/translations.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.translations = await response.json();
      this.translationsLoaded = true;
      return this.translations;
    } catch (error) {
      console.error('Failed to load translations:', error);
      this.translations = {};
      return this.translations;
    }
  }

  /**
   * Get translation by key path
   * @param {string} keyPath - Dot notation path (e.g., "common.navigation.home")
   * @param {string} lang - Language code (optional, uses current language if not provided)
   * @returns {string} Translation or key if not found
   */
  get(keyPath, lang = null) {
    if (!this.translations) {
      return keyPath;
    }

    const language = lang || this.currentLanguage;
    const keys = keyPath.split('.');
    let value = this.translations;

    // Navigate through the object structure
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return keyPath; // Return key if path not found
      }
    }

    // Get the language-specific value
    if (value && typeof value === 'object' && language in value) {
      return value[language];
    }

    return keyPath;
  }

  /**
   * Apply translations to elements with data-i18n attribute
   */
  applyTranslations() {
    if (!this.translations) {
      console.warn('Translations not loaded');
      return;
    }

    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    
    elements.forEach(element => {
      const keyPath = element.getAttribute('data-i18n');
      const translation = this.get(keyPath);
      
      if (translation && translation !== keyPath) {
        // Check if element has data-i18n-target attribute for specific property
        const target = element.getAttribute('data-i18n-target');
        
        if (target) {
          // Apply to specific attribute (e.g., placeholder, title, aria-label)
          element.setAttribute(target, translation);
        } else {
          // Apply to text content
          element.textContent = translation;
        }
      }
    });
  }

  /**
   * Get the opposite page URL for language switching
   * @returns {string} URL of the page in the other language
   */
  getAlternatePageUrl() {
    const path = window.location.pathname;
    const filenameFromPath = path.split('/').pop();
    const filename = (!filenameFromPath || filenameFromPath === '/')
      ? (this.currentLanguage === 'en' ? 'index-en.html' : 'index.html')
      : filenameFromPath;
    const search = window.location.search;
    const hash = window.location.hash;

    let alternateFilename;

    if (this.currentLanguage === 'en') {
      // Switch from English to French: remove -en suffix
      alternateFilename = filename.replace('-en.html', '.html');
    } else {
      // Switch from French to English: add -en suffix
      alternateFilename = filename.replace('.html', '-en.html');
    }

    // Reconstruct the URL
    const pathParts = path.split('/');
    pathParts[pathParts.length - 1] = alternateFilename;
    
    return pathParts.join('/') + search + hash;
  }

  /**
   * Switch to the other language
   */
  switchLanguage() {
    const alternateUrl = this.getAlternatePageUrl();
    window.location.href = alternateUrl;
  }

  /**
   * Get current language code
   * @returns {string} Current language code ('fr' or 'en')
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Check if current language is English
   * @returns {boolean}
   */
  isEnglish() {
    return this.currentLanguage === 'en';
  }

  /**
   * Check if current language is French
   * @returns {boolean}
   */
  isFrench() {
    return this.currentLanguage === 'fr';
  }

  /**
   * Save language preference to localStorage
   * @param {string} lang - Language code
   */
  saveLanguagePreference(lang) {
    try {
      localStorage.setItem(this.STORAGE_KEY, lang);
    } catch (error) {
      // Silent fail if localStorage is not available
    }
  }

  /**
   * Get saved language preference from localStorage
   * @returns {string|null} Saved language code or null
   */
  getSavedLanguagePreference() {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get the file mapping for navigation links
   * Returns the correct filename for the current language
   * @param {string} baseName - Base filename without extension (e.g., 'index', 'contact-devis')
   * @returns {string} Full filename with correct language suffix
   */
  getLocalizedFilename(baseName) {
    if (this.currentLanguage === 'en') {
      return `${baseName}-en.html`;
    }
    return `${baseName}.html`;
  }

  /**
   * Update all navigation links to point to correct language version
   */
  updateNavigationLinks() {
    const navLinks = document.querySelectorAll('.main-nav-link, .footer-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) {
        return; // Skip external links and anchors
      }

      // Extract base filename
      const filename = href.split('/').pop().replace('.html', '').replace('-en', '');
      
      // Set correct localized filename
      if (this.currentLanguage === 'en' && !href.includes('-en.html')) {
        link.setAttribute('href', href.replace('.html', '-en.html'));
      }
    });
  }
}

// Initialize and expose globally
let languageManager;

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    languageManager = new LanguageManager();
    await languageManager.init();
    window.LanguageManager = languageManager;
    
    // Dispatch custom event when language manager is ready
    document.dispatchEvent(new CustomEvent('languageManagerReady', { 
      detail: { language: languageManager.getCurrentLanguage() } 
    }));
  });
} else {
  languageManager = new LanguageManager();
  languageManager.init().then(() => {
    window.LanguageManager = languageManager;
    
    document.dispatchEvent(new CustomEvent('languageManagerReady', { 
      detail: { language: languageManager.getCurrentLanguage() } 
    }));
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LanguageManager;
}

