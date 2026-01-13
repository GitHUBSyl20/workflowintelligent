
// WebFont Loader
if (window.WebFont) {
  WebFont.load({
    google: {
      families: [
        "Lato:100,100italic,300,300italic,400,400italic,700,700italic,900,900italic",
      ],
    },
  });
}
// Webflow Touch Detection
(function (o, c) {
  var n = c.documentElement,
    t = " w-mod-";
  n.className += t + "js";
  ("ontouchstart" in o || (o.DocumentTouch && c instanceof DocumentTouch)) &&
    (n.className += t + "touch");
})(window, document);

function onReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

onReady(function() {
  var $tabLinks = $('.w-tab-link');
  var $tabMenus = $('.w-tab-menu');
  var $tabPanes = $('.w-tab-pane');
  var $tabs = $('.w-tabs');

  $tabLinks.each(function(i, el) {
  });

  $tabMenus.each(function(i, el) {
  });

  $tabPanes.each(function(i, el) {
  });

  $tabs.each(function(i, el) {
  });

  $tabLinks.on('click', function(e) {
  });

  // Hide Webflow "Made in Webflow" badge if present
  (function () {
    "use strict";
    function hideWebflowBadge() {
      const selectors = [
        ".w-webflow-badge",
        '[class*="webflow-badge"]',
        '[class*="made-in-webflow"]',
      ];
      selectors.forEach((selector) => {
        document.querySelectorAll(selector).forEach((el) => {
          el.style.display = "none";
        });
      });
    }
    // Use MutationObserver to hide badge if it appears later
    const observer = new MutationObserver(hideWebflowBadge);
    observer.observe(document.body, { childList: true, subtree: true });
    // Initial call
    hideWebflowBadge();
  })();
});

// Minimal, robust tab switching for all pages
$(function() {
  $('.w-tab-link').on('click', function(e) {
    e.preventDefault();
    var $clicked = $(this);
    var tab = $clicked.attr('data-w-tab');
    var $tabs = $clicked.closest('.w-tabs');
    var $links = $tabs.find('.w-tab-link');
    var $panes = $tabs.find('.w-tab-pane');
    $links.removeClass('w--current');
    $clicked.addClass('w--current');
    $panes.removeClass('w--tab-active');
    $panes.filter('[data-w-tab="' + tab + '"]').addClass('w--tab-active');
  });
  // On load, ensure only one tab is active
  $('.w-tabs').each(function() {
    var $tabs = $(this);
    var $links = $tabs.find('.w-tab-link');
    var $panes = $tabs.find('.w-tab-pane');
    var $current = $links.filter('.w--current');
    if ($current.length === 0) {
      $links.first().addClass('w--current');
      $panes.removeClass('w--tab-active');
      $panes.first().addClass('w--tab-active');
    }
  });
});



  // GSAP animation for feature cards
  if (window.gsap && document.querySelector('.feature-card')) {
    // Register ScrollTrigger if available
    if (window.gsap.registerPlugin && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
    
    // Build animation config
    const animationConfig = {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.18,
      ease: 'power2.out'
    };
    
    // Only add scrollTrigger if the plugin is available
    if (window.ScrollTrigger) {
      animationConfig.scrollTrigger = {
        trigger: '.feature-cards-section',
        start: 'top 80%',
        once: true
      };
    }
    
    gsap.to('.feature-card', animationConfig);
  }

  // GSAP horizontal scroll for about page orange section carousel
  if (window.gsap && window.ScrollTrigger && document.querySelector('.carousel-track')) {
    gsap.registerPlugin(ScrollTrigger);
    const track = document.querySelector('.carousel-track');
    const outer = document.querySelector('.carousel-outer');
    gsap.to(track, {
      x: () => {
        return -(track.scrollWidth - outer.clientWidth);
      },
      ease: "none",
      scrollTrigger: {
        trigger: ".orange-section",
        start: "top center",
        end: () => `+=${track.scrollWidth - outer.clientWidth}`,
        scrub: true,
        pin: false
      }
    });
  }


$(document).ready(function(){
  // Portfolio Accordion Script
  // Selects accordion links within sections having an ID starting with "automatisation-portfolio" or "ai-tools-portfolio"
  // This makes it reusable if you add a similar accordion to the AI tools page.
  $(".portfolio-section .accordion .accordion-trigger").on("click", function(e){
    const $this = $(this);
    const $content = $this.siblings(".content");
    const $accordion = $this.closest('.accordion');
    const $item = $this.closest('.accordion-item');

    const wasActive = $this.hasClass("active");

    // Remove .active and .open from all items in this accordion
    $accordion.find('.accordion-trigger.active').removeClass("active");
    $accordion.find('.accordion-item.open').removeClass("open");
    
    // Instead of simple slideUp, create a more elegant animation
    $accordion.find('.content').each(function() {
      const $thisContent = $(this);
      if ($thisContent.is(':visible')) {
        $thisContent.css('overflow', 'hidden')
          .animate({
            height: 0,
            opacity: 0,
            paddingTop: 0,
            paddingBottom: 0
          }, {
            duration: 1000,
            easing: 'easeOutQuart',
            complete: function() {
              $(this).hide().css({
                height: '',
                opacity: '',
                paddingTop: '',
                paddingBottom: '',
                overflow: ''
              });
            }
          });
      }
    });

    if (!wasActive) {
      $this.addClass("active");
      $item.addClass("open");
      
      // Instead of simple slideDown, create a more elegant animation
      $content.css({
        display: 'block',
        height: 0,
        opacity: 0,
        paddingTop: 0,
        paddingBottom: 0,
        overflow: 'hidden'
      }).animate({
        height: $content[0].scrollHeight,
        opacity: 1,
        paddingTop: '',
        paddingBottom: ''
      }, {
        duration: 800,
        easing: 'easeOutCubic',
        complete: function() {
          $(this).css({
            height: '',
            overflow: ''
          });
        }
      });
    }
  });

  // Add easing functions if not already included with jQuery
  if (typeof $.easing.easeOutCubic !== 'function') {
    $.extend($.easing, {
      easeOutCubic: function (x, t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
      },
      easeOutQuart: function (x, t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
      }
    });
  }

  // --- Modal Logic for Recap Table ---
  const openBtn = $('#open-modal-btn');
  const closeBtn = $('#close-modal-btn');
  const modal = $('#recap-modal');

  function showModal() {
    modal.css('display', 'flex');
    setTimeout(() => modal.addClass('active'), 10); // allow display to apply before transition
  }

  function hideModal() {
    modal.removeClass('active');
    setTimeout(() => modal.css('display', 'none'), 300); // wait for transition to finish
  }

  if (openBtn.length && modal.length) {
    openBtn.on('click', function(e) {
      e.preventDefault();
      showModal();
    });
  }

  if (closeBtn.length) {
    closeBtn.on('click', hideModal);
  }

  // Hide modal on overlay click
  modal.on('click', function(e) {
    if ($(e.target).is(modal)) {
      hideModal();
    }
  });

  // Hide modal on Escape key press
  $(document).on('keyup', function(e) {
    if (e.key === "Escape" && modal.hasClass('active')) {
      hideModal();
    }
  });
});

// ============================================
// DEBUGGING: Visual Debug Panel - IMMEDIATE
// ============================================
(function() {
  // Create debug panel immediately (before DOMContentLoaded)
  const debugPanel = document.createElement('div');
  debugPanel.id = 'menu-debug-panel';
  debugPanel.style.cssText = 'position: fixed; bottom: 10px; left: 10px; right: 10px; ' +
    'background: rgba(0, 0, 0, 0.95); color: #0f0; ' +
    'font-family: monospace; font-size: 11px; ' +
    'padding: 10px; border-radius: 5px; ' +
    'z-index: 99999; max-height: 300px; overflow-y: auto; ' +
    'border: 2px solid #0f0; box-shadow: 0 0 10px rgba(0, 255, 0, 0.5);';
  
  debugPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
      <strong style="color: #0f0;">🔍 MENU DEBUG</strong>
      <button id="debug-toggle" style="background: #0f0; color: #000; border: none; 
              padding: 5px 10px; border-radius: 3px; cursor: pointer; font-weight: bold;">
        Masquer
      </button>
    </div>
    <div id="debug-content" style="max-height: 250px; overflow-y: auto;"></div>
  `;
  
  // Append immediately if body exists, otherwise wait
  if (document.body) {
    document.body.appendChild(debugPanel);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(debugPanel);
    });
  }
  
  let debugLogs = [];
  const MAX_LOGS = 30;
  
  function addDebugLog(message, data) {
    const timestamp = new Date().toLocaleTimeString();
    let logText = `[${timestamp}] ${message}`;
    
    if (data) {
      try {
        logText += '\n' + JSON.stringify(data, null, 2);
      } catch (e) {
        logText += '\n' + String(data);
      }
    }
    
    console.log('[MENU DEBUG]', message, data || '');
    
    debugLogs.push(logText);
    if (debugLogs.length > MAX_LOGS) {
      debugLogs.shift();
    }
    
    const content = document.getElementById('debug-content');
    if (content) {
      content.innerHTML = debugLogs.map(log => 
        `<div style="margin-bottom: 5px; padding: 3px; border-bottom: 1px solid #333; white-space: pre-wrap; word-break: break-word;">${log}</div>`
      ).join('');
      content.scrollTop = content.scrollHeight;
    }
  }
  
  // Make addDebugLog globally available
  window.addDebugLog = addDebugLog;
  
  // Toggle button
  setTimeout(function() {
    const toggleBtn = document.getElementById('debug-toggle');
    const content = document.getElementById('debug-content');
    if (toggleBtn && content) {
      let isVisible = true;
      toggleBtn.addEventListener('click', function() {
        isVisible = !isVisible;
        content.style.display = isVisible ? 'block' : 'none';
        toggleBtn.textContent = isVisible ? 'Masquer' : 'Afficher';
      });
    }
  }, 100);
  
  addDebugLog('Debug panel created');
})();

// ============================================
// Hamburger menu - SIMPLE & RELIABLE VERSION
// Previous version was too complex - this is streamlined
// ============================================
(function initMenu() {
  // Check if simple version is being used instead
  if (window.DISABLE_COMPLEX_MENU) {
    console.log('[MAIN.JS] Complex menu disabled - using simple version instead');
    if (window.addDebugLog) {
      window.addDebugLog('ℹ️ Complex menu code disabled', {
        reason: 'DISABLE_COMPLEX_MENU flag is set',
        using: 'hamburger-simple.js instead'
      });
    }
    return; // Exit early, don't run this code
  }
  
  function waitForElements() {
    const hamburger = document.querySelector('.nav-hamburger');
    const navLinks = document.querySelector('.main-nav-links');
    
    if (window.addDebugLog) {
      window.addDebugLog('Checking for elements', {
        hamburger: !!hamburger,
        navLinks: !!navLinks,
        hamburgerClasses: hamburger ? hamburger.className : 'N/A',
        navLinksClasses: navLinks ? navLinks.className : 'N/A'
      });
    }
    
    if (!hamburger || !navLinks) {
      if (window.addDebugLog) {
        window.addDebugLog('Elements not found, retrying...');
      }
      setTimeout(waitForElements, 100);
      return;
    }
    
    if (window.addDebugLog) {
      window.addDebugLog('✅ Elements found! Initializing menu...', {
        hamburgerElement: hamburger,
        navLinksElement: navLinks,
        userAgent: navigator.userAgent,
        isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
        isFirefox: /Firefox/.test(navigator.userAgent),
        isChrome: /Chrome/.test(navigator.userAgent)
      });
    }
    
    // Track state
    let isMenuOpen = false;
    let lastInteraction = 0;
    let touchStartTime = 0;
    let touchStartPos = { x: 0, y: 0 };
    let touchHandled = false;
    
    // Track if touchend was ever called
    let touchendCalled = false;
    
    // 🔥 NUCLEAR OPTION: Ultra-simple tap handler that should ALWAYS work 🔥
    // This runs FIRST and provides a baseline that's guaranteed to work
    let simpleLastTap = 0;
    hamburger.addEventListener('touchend', function(e) {
      const now = Date.now();
      const timeSinceLast = now - simpleLastTap;
      
      if (window.addDebugLog) {
        window.addDebugLog('🔥 SIMPLE TAP HANDLER (nuclear option)', {
          timeSinceLast: timeSinceLast + 'ms',
          willActivate: timeSinceLast > 200 // Debounce
        });
      }
      
      // Simple debounce - only activate if it's been 200ms since last tap
      if (timeSinceLast > 200) {
        simpleLastTap = now;
        
        // Toggle immediately - no complex logic, no criteria checking
        if (window.addDebugLog) {
          window.addDebugLog('🔥 SIMPLE HANDLER: Toggling menu NOW (no questions asked)');
        }
        
        // Don't call toggleMenu yet - let the main handler do it
        // But mark that we detected a valid tap
        window._simpleHandlerDetectedTap = now;
      }
    }, { passive: true, capture: true }); // passive: true, runs first
    
    // Simple toggle function
    function toggleMenu(source) {
      const now = Date.now();
      const timeSinceLast = now - lastInteraction;
      
      if (window.addDebugLog) {
        window.addDebugLog(`toggleMenu called from: ${source}`, {
          timeSinceLast: timeSinceLast + 'ms',
          currentState: isMenuOpen ? 'OPEN' : 'CLOSED'
        });
      }
      
      isMenuOpen = !isMenuOpen;
      lastInteraction = now;
      
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.classList.toggle('menu-open');
      
      if (window.addDebugLog) {
        window.addDebugLog('Menu toggled', {
          newState: isMenuOpen ? 'OPEN' : 'CLOSED',
          hamburgerActive: hamburger.classList.contains('active'),
          navLinksOpen: navLinks.classList.contains('open')
        });
      }
      
      if (hamburger.hasAttribute('aria-expanded')) {
        hamburger.setAttribute('aria-expanded', isMenuOpen);
      }
    }
    
    // Try MULTIPLE event types to catch everything
    function handleInteraction(e, source) {
      const now = Date.now();
      const timeSinceLast = now - lastInteraction;
      const minTimeBetweenInteractions = 100; // Reduced from 300ms to be less aggressive
      
      if (window.addDebugLog) {
        window.addDebugLog(`🎯 handleInteraction called from ${source}`, {
          type: e.type,
          target: e.target.tagName,
          defaultPrevented: e.defaultPrevented,
          isTrusted: e.isTrusted,
          timeSinceLast: timeSinceLast + 'ms',
          willBeBlocked: timeSinceLast < minTimeBetweenInteractions
        });
      }
      
      // Prevent double-trigger - REDUCED from 300ms to 100ms
      if (timeSinceLast < minTimeBetweenInteractions) {
        if (window.addDebugLog) {
          window.addDebugLog(`🚫 ${source} blocked - too soon after last interaction (${timeSinceLast}ms < ${minTimeBetweenInteractions}ms)`);
        }
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return;
      }
      
      if (e.preventDefault) e.preventDefault();
      if (e.stopPropagation) e.stopPropagation();
      
      if (window.addDebugLog) {
        window.addDebugLog(`✅ ${source} proceeding to toggleMenu`);
      }
      
      toggleMenu(source);
    }
    
    // Touch events - ENHANCED LOGGING
    let touchStartTimeout = null;
    
    hamburger.addEventListener('touchstart', function(e) {
      touchendCalled = false; // Reset flag for this touch sequence
      touchStartTime = Date.now();
      const touch = e.touches[0];
      touchStartPos = { x: touch.clientX, y: touch.clientY };
      touchHandled = false;
      
      // Clear any existing timeout
      if (touchStartTimeout) {
        clearTimeout(touchStartTimeout);
      }
      
      // Set timeout to check if touchend was called (for Firefox mobile detection)
      touchStartTimeout = setTimeout(function() {
        if (!touchendCalled && window.addDebugLog) {
          window.addDebugLog('⚠️ WARNING: touchstart fired but touchend never called!', {
            timeSinceTouchStart: Date.now() - touchStartTime + 'ms',
            touchHandled: touchHandled,
            'This may indicate Firefox mobile issue - click should work as fallback'
          });
        }
        touchendCalled = false; // Reset for next time
      }, 1000);
      
      if (window.addDebugLog) {
        window.addDebugLog('🔵 TOUCHSTART', {
          pos: touchStartPos,
          timestamp: touchStartTime,
          touchesCount: e.touches.length,
          passive: 'true (cannot preventDefault)',
          userAgent: navigator.userAgent.substring(0, 50)
        });
      }
    }, { passive: true, capture: true });
    
    // Add touchcancel handler to detect when touch is cancelled
    hamburger.addEventListener('touchcancel', function(e) {
      if (window.addDebugLog) {
        window.addDebugLog('⚠️ TOUCHCANCEL - Touch was cancelled!', {
          timestamp: Date.now(),
          timeSinceStart: Date.now() - touchStartTime + 'ms'
        });
      }
      touchHandled = false; // Reset so click can work
    }, { passive: true, capture: true });
    
    hamburger.addEventListener('touchend', function(e) {
      touchendCalled = true;
      const touchDuration = Date.now() - touchStartTime;
      const touch = e.changedTouches[0];
      if (!touch) {
        if (window.addDebugLog) {
          window.addDebugLog('❌ TOUCHEND - No touch data!', {
            changedTouchesCount: e.changedTouches.length
          });
        }
        return;
      }
      
      const touchEndPos = { x: touch.clientX, y: touch.clientY };
      const distance = Math.sqrt(
        Math.pow(touchEndPos.x - touchStartPos.x, 2) + 
        Math.pow(touchEndPos.y - touchStartPos.y, 2)
      );
      
      const meetsDuration = touchDuration < 500;
      const meetsDistance = distance < 20;
      const meetsCriteria = meetsDuration && meetsDistance;
      
      if (window.addDebugLog) {
        window.addDebugLog('🟢 TOUCHEND', {
          duration: touchDuration + 'ms',
          distance: distance.toFixed(2) + 'px',
          meetsDuration: meetsDuration + ' (< 500ms)',
          meetsDistance: meetsDistance + ' (< 20px)',
          meetsCriteria: meetsCriteria,
          startPos: touchStartPos,
          endPos: touchEndPos,
          userAgent: navigator.userAgent.substring(0, 50)
        });
      }
      
      // MUCH MORE LENIENT CRITERIA - Allow longer taps and more movement
      // Increased from 500ms to 1000ms and from 20px to 50px
      const maxDuration = 1000; // 1 second instead of 500ms
      const maxDistance = 50; // 50px instead of 20px
      const meetsLenientCriteria = touchDuration < maxDuration && distance < maxDistance;
      
      if (window.addDebugLog) {
        window.addDebugLog('📊 TOUCHEND Criteria Check', {
          duration: touchDuration + 'ms',
          maxAllowed: maxDuration + 'ms',
          distance: distance.toFixed(2) + 'px',
          maxAllowed: maxDistance + 'px',
          meetsOldCriteria: meetsCriteria,
          meetsLenientCriteria: meetsLenientCriteria
        });
      }
      
      // 🚨 CRITICAL DECISION POINT 🚨
      // If we call preventDefault() here, the browser will NOT generate a click event
      // This means ONLY touchend can trigger the menu
      // If touchend doesn't trigger (criteria not met), NOTHING will trigger
      
      // Use lenient criteria - this should work for most taps
      if (meetsLenientCriteria) {
        if (window.addDebugLog) {
          window.addDebugLog('✅ TOUCHEND: Lenient criteria met, toggling menu', {
            '⚠️ CALLING': 'preventDefault() - this will BLOCK the click event',
            willToggleMenu: true
          });
        }
        try {
          if (e.preventDefault) e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();
        } catch (err) {
          if (window.addDebugLog) {
            window.addDebugLog('❌ TOUCHEND: Error preventing default', err.message);
          }
        }
        touchHandled = true;
        toggleMenu('TOUCHEND');
        
        // Block click event for a short time
        setTimeout(function() {
          touchHandled = false;
          if (window.addDebugLog) {
            window.addDebugLog('🔄 touchHandled reset to false');
          }
        }, 500);
      } else {
        if (window.addDebugLog) {
          window.addDebugLog('❌ TOUCHEND: Lenient criteria NOT met', {
            reason: touchDuration >= maxDuration ? 'Duration too long (' + touchDuration + 'ms >= ' + maxDuration + 'ms)' : 'Distance too far (' + distance.toFixed(2) + 'px >= ' + maxDistance + 'px)',
            touchHandled: touchHandled,
            '✅ GOOD NEWS': 'NOT calling preventDefault() - click event should still fire as fallback',
            willTryClick: true
          });
        }
        // 🚨 CRITICAL: Don't call preventDefault() here!
        // Let the browser generate the natural click event
        // Don't set touchHandled, let click event handle it
      }
    }, { passive: false, capture: true });
    
    // Click event (with protection against double-trigger)
    hamburger.addEventListener('click', function(e) {
      const timeSinceLast = Date.now() - lastInteraction;
      const timeSinceTouchStart = Date.now() - touchStartTime;
      
      if (window.addDebugLog) {
        window.addDebugLog('🖱️ CLICK event', {
          touchHandled: touchHandled,
          touchendCalled: touchendCalled,
          timeSinceLast: timeSinceLast + 'ms',
          timeSinceTouchStart: timeSinceTouchStart + 'ms',
          willBeBlocked: touchHandled && timeSinceLast < 600,
          userAgent: navigator.userAgent.substring(0, 50)
        });
      }
      
      // If touch was just handled, ignore click - REDUCED timeout from 600ms to 300ms
      const clickBlockTimeout = 300; // Reduced from 600ms
      if (touchHandled && timeSinceLast < clickBlockTimeout) {
        if (window.addDebugLog) {
          window.addDebugLog('🚫 CLICK blocked - touch was just handled', {
            touchHandled: touchHandled,
            timeSinceLast: timeSinceLast + 'ms',
            timeout: clickBlockTimeout + 'ms'
          });
        }
        if (e.preventDefault) e.preventDefault();
        if (e.stopPropagation) e.stopPropagation();
        return;
      }
      
      // FALLBACK: If touchend never fired (Firefox issue), allow click to work
      if (!touchendCalled && timeSinceTouchStart > 100 && timeSinceTouchStart < 2000) {
        if (window.addDebugLog) {
          window.addDebugLog('🔄 CLICK fallback - touchend never fired, allowing click', {
            touchendCalled: touchendCalled,
            timeSinceTouchStart: timeSinceTouchStart + 'ms'
          });
        }
        // Don't block, let it proceed
      }
      
      if (window.addDebugLog) {
        window.addDebugLog('✅ CLICK proceeding to handleInteraction');
      }
      
      handleInteraction(e, 'CLICK');
    }, { capture: true });
    
    // Also try mousedown (some browsers use this)
    hamburger.addEventListener('mousedown', function(e) {
      if (window.addDebugLog) {
        window.addDebugLog('MOUSEDOWN event');
      }
      // Don't toggle on mousedown, just log
    }, { capture: true });
    
    // Pointer events (modern browsers)
    if (hamburger.addEventListener) {
      hamburger.addEventListener('pointerdown', function(e) {
        if (window.addDebugLog) {
          window.addDebugLog('👆 POINTERDOWN event', { 
            pointerType: e.pointerType,
            willHandle: e.pointerType === 'touch'
          });
        }
        if (e.pointerType === 'touch') {
          handleInteraction(e, 'POINTERDOWN-TOUCH');
        }
      }, { capture: true });
    }
    
    // Close menu on link click
    navLinks.querySelectorAll('.main-nav-link').forEach(function(link) {
      link.addEventListener('click', function(e) {
        if (window.addDebugLog) {
          window.addDebugLog('Link clicked', link.href);
        }
        setTimeout(function() {
          isMenuOpen = false;
          hamburger.classList.remove('active');
          navLinks.classList.remove('open');
          document.body.classList.remove('menu-open');
          if (hamburger.hasAttribute('aria-expanded')) {
            hamburger.setAttribute('aria-expanded', 'false');
          }
        }, 100);
      });
    });
    
    // Close on outside click
    document.addEventListener('click', function(e) {
      const target = e.target;
      const isLink = target.closest('.main-nav-link');
      const isHamburger = hamburger.contains(target);
      const isNavLinks = navLinks.contains(target);
      
      if (isMenuOpen && !isLink && !isHamburger && !isNavLinks) {
        if (window.addDebugLog) {
          window.addDebugLog('Closing menu - clicked outside');
        }
        isMenuOpen = false;
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
        if (hamburger.hasAttribute('aria-expanded')) {
          hamburger.setAttribute('aria-expanded', 'false');
        }
      }
    });
    
    // CRITICAL: Add a direct simple click handler WITHOUT complex logic
    // This is a FALLBACK that should ALWAYS work
    hamburger.addEventListener('click', function(e) {
      const now = Date.now();
      const simpleHandlerTime = window._simpleHandlerDetectedTap || 0;
      const wasRecentlyTapped = (now - simpleHandlerTime) < 500;
      
      if (window.addDebugLog) {
        window.addDebugLog('🆘 FALLBACK CLICK HANDLER - This should ALWAYS work', {
          timestamp: now,
          defaultPrevented: e.defaultPrevented,
          target: e.target.tagName,
          lastInteraction: lastInteraction,
          timeSinceLastInteraction: now - lastInteraction + 'ms',
          simpleHandlerDetectedTap: wasRecentlyTapped,
          willActivate: (now - lastInteraction) > 150
        });
      }
      
      // If we reach here, the hamburger IS clickable
      // Check if menu is already being handled
      if ((now - lastInteraction) > 150) { // Only if not recently handled
        if (window.addDebugLog) {
          window.addDebugLog('🆘 FALLBACK activating menu toggle');
        }
        toggleMenu('FALLBACK-CLICK');
      } else {
        if (window.addDebugLog) {
          window.addDebugLog('🆘 FALLBACK skipping - already handled recently', {
            timeSince: (now - lastInteraction) + 'ms'
          });
        }
      }
    }, { capture: false, passive: false }); // Run AFTER other listeners
    
    if (window.addDebugLog) {
      window.addDebugLog('✅ All event listeners attached successfully!', {
        touchstartListener: 'attached',
        touchendListener: 'attached',
        touchcancelListener: 'attached',
        clickListener: 'attached (x2 - normal + fallback)',
        pointerdownListener: 'attached',
        mousedownListener: 'attached',
        hamburgerElement: hamburger,
        navLinksElement: navLinks,
        '⚠️ IMPORTANT': 'FALLBACK CLICK handler added - should work even if others fail'
      });
    }
  }
  
  // Start checking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForElements);
  } else {
    waitForElements();
  }
})();

// Active link highlighting
document.addEventListener('DOMContentLoaded', function() {
  const links = document.querySelectorAll('.main-nav-link');
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';
  let matchFound = false;

  links.forEach(link => {
    const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
    if (linkPage === currentPage && !matchFound) {
      link.classList.add('active');
      matchFound = true;
    } else {
      link.classList.remove('active');
    }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  // Feature cards initialization
  const cards = document.querySelectorAll('.feature-card');
  
  cards.forEach((card, idx) => {
    const style = window.getComputedStyle(card);
    // Initialize feature cards if needed
  });
});

// Modal functionality
function openModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'block';
    const modalImage = document.getElementById('modalImage');
    const caption = document.getElementById('caption');
    if (modalImage) modalImage.src = '/assets/Demo-relance.png';
    if (caption) caption.innerHTML = 'Exemple d\'alerte déclenchée automatiquement par retard de paiement';
  }
}

function closeModal() {
  const modal = document.getElementById('imageModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Event listener to close the modal
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('imageModal');
  if (modal) {
    // Close modal on escape key press
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape') {
        closeModal();
      }
    });
  }
});