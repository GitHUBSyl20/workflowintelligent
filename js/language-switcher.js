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

    // Use existing switcher if present (to avoid layout shift), otherwise create it
    let switcher = document.querySelector('.language-switcher');
    const isNew = !switcher;

    if (!switcher) {
      switcher = document.createElement('a');
      switcher.className = 'language-switcher';
    }

    switcher.href = langManager.getAlternatePageUrl();
    switcher.setAttribute('aria-label', currentLang === 'fr' ? 'Switch to English' : 'Passer en français');

    // Ensure flag element
    let flag = switcher.querySelector('.language-switcher-flag');
    if (!flag) {
      flag = document.createElement('span');
      flag.className = 'language-switcher-flag';
      switcher.appendChild(flag);
    }
    flag.textContent = currentLang === 'fr' ? '🇬🇧' : '🇫🇷';

    // Ensure text element
    let text = switcher.querySelector('.language-switcher-text');
    if (!text) {
      text = document.createElement('span');
      text.className = 'language-switcher-text';
      switcher.appendChild(text);
    }
    text.textContent = currentLang === 'fr' ? 'EN' : 'FR';

    // Add click handler once
    if (!switcher.dataset.langSwitcherBound) {
      switcher.addEventListener('click', function(e) {
        e.preventDefault();
        langManager.switchLanguage();
      });
      switcher.dataset.langSwitcherBound = '1';
    }

    // Insert into navigation only if newly created
    if (isNew) {
      const navLinks = document.querySelector('.main-nav-links');
      if (navLinks) {
        navLinks.appendChild(switcher);
      } else {
        // Fallback: add after logo if nav-links not found
        const navbar = document.querySelector('.main-navbar');
        if (navbar) {
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
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
  } else {
    initLanguageSwitcher();
  }
})();
