// ============================================
// HAMBURGER MENU - ULTRA SIMPLE FALLBACK
// This is the NUCLEAR OPTION - should ALWAYS work
// ============================================

(function() {
  'use strict';
  
  console.log('[FALLBACK] Initializing ultra-simple hamburger menu...');
  
  function initSimpleMenu() {
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks = document.querySelector('.main-nav-links');
    
    if (!hamburger || !navLinks) {
      console.log('[FALLBACK] Elements not found, retrying...');
      setTimeout(initSimpleMenu, 100);
      return;
    }
    
    console.log('[FALLBACK] Elements found! Attaching simple handlers...');
    
    let isOpen = false;
    let lastToggle = 0;
    
    function simpleToggle() {
      const now = Date.now();
      
      // Simple debounce
      if (now - lastToggle < 200) {
        console.log('[FALLBACK] Debounced - too soon');
        return;
      }
      
      lastToggle = now;
      isOpen = !isOpen;
      
      console.log('[FALLBACK] Toggling menu to:', isOpen ? 'OPEN' : 'CLOSED');
      
      if (isOpen) {
        hamburger.classList.add('active');
        navLinks.classList.add('open');
        document.body.classList.add('menu-open');
      } else {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
      }
      
      if (window.addDebugLog) {
        window.addDebugLog('[FALLBACK] Menu toggled', {
          state: isOpen ? 'OPEN' : 'CLOSED',
          hamburgerActive: hamburger.classList.contains('active'),
          navLinksOpen: navLinks.classList.contains('open')
        });
      }
    }
    
    // Attach ALL event types - at least one should work!
    
    // Touch events
    hamburger.addEventListener('touchend', function(e) {
      console.log('[FALLBACK] touchend detected');
      simpleToggle();
    }, { passive: true });
    
    // Click event
    hamburger.addEventListener('click', function(e) {
      console.log('[FALLBACK] click detected');
      simpleToggle();
    });
    
    // Pointer events
    hamburger.addEventListener('pointerdown', function(e) {
      if (e.pointerType === 'touch') {
        console.log('[FALLBACK] pointerdown (touch) detected');
        simpleToggle();
      }
    });
    
    console.log('[FALLBACK] All simple handlers attached!');
    
    if (window.addDebugLog) {
      window.addDebugLog('[FALLBACK] Ultra-simple menu initialized', {
        hamburger: hamburger,
        navLinks: navLinks,
        handlers: ['touchend', 'click', 'pointerdown']
      });
    }
  }
  
  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSimpleMenu);
  } else {
    initSimpleMenu();
  }
})();
