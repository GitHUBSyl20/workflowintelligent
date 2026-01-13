// ============================================
// HAMBURGER MENU - SIMPLE & RELIABLE
// Replace the complex version with this simple one
// ============================================

(function() {
  'use strict';
  
  function init() {
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks = document.querySelector('.main-nav-links');
    
    if (!hamburger || !navLinks) {
      setTimeout(init, 50);
      return;
    }
    
    console.log('[SIMPLE MENU] Initializing...');
    if (window.addDebugLog) {
      window.addDebugLog('✅ SIMPLE MENU: Elements found', {
        hamburger: hamburger,
        navLinks: navLinks
      });
    }
    
    let isOpen = false;
    let lastToggle = 0;
    
    function toggle() {
      const now = Date.now();
      
      // Debounce: 250ms between toggles
      if (now - lastToggle < 250) {
        console.log('[SIMPLE MENU] Debounced');
        return;
      }
      
      lastToggle = now;
      isOpen = !isOpen;
      
      console.log('[SIMPLE MENU] Toggle:', isOpen ? 'OPEN' : 'CLOSED');
      
      hamburger.classList.toggle('active', isOpen);
      navLinks.classList.toggle('open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      
      if (hamburger.hasAttribute('aria-expanded')) {
        hamburger.setAttribute('aria-expanded', isOpen);
      }
      
      if (window.addDebugLog) {
        window.addDebugLog('🎯 SIMPLE MENU: Toggled', {
          newState: isOpen ? 'OPEN' : 'CLOSED',
          hamburgerActive: hamburger.classList.contains('active'),
          navLinksOpen: navLinks.classList.contains('open')
        });
      }
    }
    
    // Strategy: Use ONLY click event (works on both mobile and desktop)
    // Let the browser handle touch → click conversion naturally
    hamburger.addEventListener('click', function(e) {
      console.log('[SIMPLE MENU] Click detected');
      if (window.addDebugLog) {
        window.addDebugLog('👆 SIMPLE MENU: Click event', {
          type: e.type,
          isTrusted: e.isTrusted
        });
      }
      toggle();
    });
    
    // Close menu when clicking links
    navLinks.querySelectorAll('.main-nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        console.log('[SIMPLE MENU] Link clicked, closing menu');
        isOpen = false;
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (isOpen && !hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        console.log('[SIMPLE MENU] Outside click, closing menu');
        isOpen = false;
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
      }
    });
    
    console.log('[SIMPLE MENU] Initialized successfully!');
    if (window.addDebugLog) {
      window.addDebugLog('✅ SIMPLE MENU: Initialization complete', {
        strategy: 'Click event only (browser handles touch→click)',
        debounce: '250ms',
        handlers: ['click', 'outside click', 'link click']
      });
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
