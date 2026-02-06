
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

  // #region agent log — diagnostic approfondi texte "Workflow Intelligent" (différences visuelles entre pages)
  (function logoTextDeepDiagnostic() {
    function logLogoText() {
      var logo = document.querySelector('.main-navbar .nav-logo');
      if (!logo) return;
      var textEl = logo.querySelector('.nav-logo-text') || logo;
      var s = window.getComputedStyle(textEl);
      var r = textEl.getBoundingClientRect();
      var logoStyle = window.getComputedStyle(logo);
      var data = {
        page: (window.location.pathname || '/').replace(/^\//, '') || 'index',
        viewportWidth: window.innerWidth,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontFamily: s.fontFamily,
        fontStyle: s.fontStyle,
        fontVariant: s.fontVariant,
        lineHeight: s.lineHeight,
        letterSpacing: s.letterSpacing,
        wordSpacing: s.wordSpacing,
        textTransform: s.textTransform,
        textDecoration: s.textDecoration,
        textRendering: s.textRendering,
        webkitFontSmoothing: s.webkitFontSmoothing || s.getPropertyValue('-webkit-font-smoothing'),
        webkitTextSizeAdjust: s.webkitTextSizeAdjust || s.getPropertyValue('-webkit-text-size-adjust'),
        paddingTop: s.paddingTop,
        paddingBottom: s.paddingBottom,
        paddingLeft: s.paddingLeft,
        paddingRight: s.paddingRight,
        marginTop: s.marginTop,
        marginBottom: s.marginBottom,
        marginLeft: s.marginLeft,
        marginRight: s.marginRight,
        width: Math.round(r.width),
        height: Math.round(r.height),
        left: Math.round(r.left),
        top: Math.round(r.top),
        transform: s.transform,
        willChange: s.willChange,
        display: s.display,
        position: s.position,
        parentDisplay: logoStyle.display,
        parentFlexDirection: logoStyle.flexDirection,
        parentAlignItems: logoStyle.alignItems,
        parentGap: logoStyle.gap,
        hasNavLogoText: !!logo.querySelector('.nav-logo-text')
      };
      fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'main.js:logoTextDeepDiagnostic', message: 'logo text deep diagnostic', data: data, timestamp: Date.now(), sessionId: 'debug-session', runId: 'logo-deep', hypothesisId: 'A' }) }).catch(function() {});
    }
    setTimeout(logLogoText, 200);
    setTimeout(logLogoText, 800);
  })();
  // #endregion

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
// Hamburger menu - SIMPLE & RELIABLE VERSION
// Strategy: Use ONLY click event (works on both mobile and desktop)
// Let the browser handle touch → click conversion naturally
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
    
    let isOpen = false;
    let lastToggle = 0;
    
    function toggle() {
      const now = Date.now();
      
      // Debounce: 250ms between toggles
      if (now - lastToggle < 250) {
        return;
      }
      
      lastToggle = now;
      isOpen = !isOpen;
      
      hamburger.classList.toggle('active', isOpen);
      navLinks.classList.toggle('open', isOpen);
      document.body.classList.toggle('menu-open', isOpen);
      
      if (hamburger.hasAttribute('aria-expanded')) {
        hamburger.setAttribute('aria-expanded', isOpen);
      }
    }
    
    // Strategy: Use ONLY click event (works on both mobile and desktop)
    // Let the browser handle touch → click conversion naturally
    // NO preventDefault(), NO complex touch logic
    hamburger.addEventListener('click', function(e) {
      toggle();
    });
    
    // Close menu when clicking links
    navLinks.querySelectorAll('.main-nav-link').forEach(function(link) {
      link.addEventListener('click', function() {
        isOpen = false;
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (isOpen && !hamburger.contains(e.target) && !navLinks.contains(e.target)) {
        isOpen = false;
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
      }
    });
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// Hamburger menu color change on scroll over orange hero section
(function() {
  'use strict';
  
  function init() {
    const hamburger = document.querySelector('.nav-hamburger');
    // Try to find hero section with either class (.accent-primary-section or .about-header)
    let heroSection = document.querySelector('.accent-primary-section');
    if (!heroSection) {
      heroSection = document.querySelector('.about-header');
    }
    
    if (!hamburger || !heroSection) {
      return; // Exit if elements don't exist
    }
    
    function checkScrollPosition() {
      // Get hero section position relative to viewport
      const heroRect = heroSection.getBoundingClientRect();
      const hamburgerRect = hamburger.getBoundingClientRect();
      
      // Hero section position relative to viewport
      const heroTop = heroRect.top; // Distance from top of viewport (negative if scrolled past)
      const heroBottom = heroRect.bottom; // Distance from top of viewport
      
      // Hamburger is fixed at top-right, typically around top: 1.2rem (~19px)
      const hamburgerTop = hamburgerRect.top; // Usually around 19px from top
      const hamburgerBottom = hamburgerRect.bottom; // Bottom of hamburger (~19px + height)
      
      // Hamburger becomes white ONLY when:
      // 1. Hero section top is at or above the hamburger position (covers the hamburger from above)
      // 2. Hero section bottom is below the top of viewport (still visible)
      // This means we're scrolled into or over the orange hero section
      const isHeroCoveringHamburger = heroTop <= hamburgerBottom && heroBottom > hamburgerTop;
      const isHeroVisibleInViewport = heroBottom >= 0; // Hero section is still in viewport
      
      const isOverOrangeHero = isHeroCoveringHamburger && isHeroVisibleInViewport;
      
      // Add class if hamburger is visually over orange hero section
      if (isOverOrangeHero) {
        hamburger.classList.add('on-orange-hero');
      } else {
        hamburger.classList.remove('on-orange-hero');
      }
    }
    
    // Check on scroll and resize
    window.addEventListener('scroll', checkScrollPosition, { passive: true });
    window.addEventListener('resize', checkScrollPosition, { passive: true });
    
    // Initial check
    checkScrollPosition();
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
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
