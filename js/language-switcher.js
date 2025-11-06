/**
 * Language Switcher Component
 * Adds a language toggle button to the navigation
 */

(function() {
  'use strict';

  function initLanguageSwitcher() {
    // Wait for LanguageManager to be ready
    if (!window.LanguageManager) {
      document.addEventListener('languageManagerReady', initLanguageSwitcher);
      return;
    }

    const langManager = window.LanguageManager;
    const currentLang = langManager.getCurrentLanguage();

    // Create language switcher element
    const switcher = document.createElement('a');
    switcher.className = 'language-switcher';
    switcher.href = langManager.getAlternatePageUrl();
    switcher.setAttribute('aria-label', currentLang === 'fr' ? 'Switch to English' : 'Passer en français');
    
    // Add flag emoji
    const flag = document.createElement('span');
    flag.className = 'language-switcher-flag';
    flag.textContent = currentLang === 'fr' ? '🇬🇧' : '🇫🇷';
    
    // Add language code text
    const text = document.createElement('span');
    text.className = 'language-switcher-text';
    text.textContent = currentLang === 'fr' ? 'EN' : 'FR';
    
    switcher.appendChild(flag);
    switcher.appendChild(text);

    // Add click handler
    switcher.addEventListener('click', function(e) {
      e.preventDefault();
      langManager.switchLanguage();
    });

    // Insert into navigation
    const navLinks = document.querySelector('.main-nav-links');
    if (navLinks) {
      navLinks.appendChild(switcher);
    } else {
      // Fallback: add after logo if nav-links not found
      const navbar = document.querySelector('.main-navbar');
      if (navbar) {
        // Create a container for the switcher
        const switcherContainer = document.createElement('div');
        switcherContainer.style.marginLeft = 'auto';
        switcherContainer.appendChild(switcher);
        
        // Insert before hamburger menu
        const hamburger = navbar.querySelector('.nav-hamburger');
        if (hamburger) {
          navbar.insertBefore(switcherContainer, hamburger);
        } else {
          navbar.appendChild(switcherContainer);
        }
      }
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
  } else {
    initLanguageSwitcher();
  }
})();

