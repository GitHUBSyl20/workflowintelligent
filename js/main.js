// Webflow Touch Detection
(function (o, c) {
  var n = c.documentElement,
    t = " w-mod-";
  n.className += t + "js";
  ("ontouchstart" in o || (o.DocumentTouch && c instanceof DocumentTouch)) &&
    (n.className += t + "touch");
})(window, document);

// main.js est charge sans defer sur la plupart des pages : attendre le DOM.
function whenDomReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

// Onglets (pages EN) : un seul panneau actif par groupe .w-tabs
whenDomReady(function () {
  document.querySelectorAll('.w-tabs').forEach(function (tabs) {
    var links = tabs.querySelectorAll('.w-tab-link');
    var panes = tabs.querySelectorAll('.w-tab-pane');
    if (!links.length) return;

    function activate(link) {
      var tab = link.getAttribute('data-w-tab');
      links.forEach(function (l) { l.classList.toggle('w--current', l === link); });
      panes.forEach(function (p) {
        p.classList.toggle('w--tab-active', p.getAttribute('data-w-tab') === tab);
      });
    }

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        activate(link);
      });
    });

    // Au chargement, garantir un onglet actif
    if (!tabs.querySelector('.w-tab-link.w--current')) {
      links[0].classList.add('w--current');
      panes.forEach(function (p, i) { p.classList.toggle('w--tab-active', i === 0); });
    }
  });
});

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


// Accordeon des sections .portfolio-section : un seul panneau ouvert a la fois.
// Fermeture 1000 ms, ouverture 800 ms (courbes easeOutQuart / easeOutCubic).
(function () {
  var EASE_CLOSE = 'cubic-bezier(0.25, 1, 0.5, 1)';
  var EASE_OPEN = 'cubic-bezier(0.33, 1, 0.68, 1)';
  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stopAnimations(el) {
    if (el.getAnimations) el.getAnimations().forEach(function (a) { a.cancel(); });
  }

  function closePanel(content) {
    stopAnimations(content);
    if (getComputedStyle(content).display === 'none') return;
    if (reduceMotion || !content.animate) {
      content.removeAttribute('style');
      return;
    }
    var cs = getComputedStyle(content);
    var from = { height: cs.height, opacity: 1, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom };
    content.style.display = 'block';
    content.style.overflow = 'hidden';
    content.animate([from, { height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' }],
      { duration: 1000, easing: EASE_CLOSE })
      .onfinish = function () { content.removeAttribute('style'); };
  }

  function openPanel(content) {
    stopAnimations(content);
    content.style.display = 'block';
    if (reduceMotion || !content.animate) return;
    var cs = getComputedStyle(content);
    var to = { height: cs.height, opacity: 1, paddingTop: cs.paddingTop, paddingBottom: cs.paddingBottom };
    content.style.overflow = 'hidden';
    content.animate([{ height: '0px', opacity: 0, paddingTop: '0px', paddingBottom: '0px' }, to],
      { duration: 800, easing: EASE_OPEN })
      .onfinish = function () { content.style.overflow = ''; };
  }

  whenDomReady(function () {
    document.querySelectorAll('.portfolio-section .accordion').forEach(function (accordion) {
      var triggers = accordion.querySelectorAll('.accordion-trigger');

      triggers.forEach(function (trigger) {
        trigger.setAttribute('aria-expanded', trigger.classList.contains('active') ? 'true' : 'false');

        trigger.addEventListener('click', function () {
          var item = trigger.closest('.accordion-item');
          var content = item && item.querySelector('.content');
          var wasActive = trigger.classList.contains('active');

          // Tout fermer, puis rouvrir celui-ci s'il etait ferme
          triggers.forEach(function (t) {
            t.classList.remove('active');
            t.setAttribute('aria-expanded', 'false');
            var it = t.closest('.accordion-item');
            if (it) it.classList.remove('open');
          });
          accordion.querySelectorAll('.content').forEach(function (c) {
            if (c !== content || wasActive) closePanel(c);
          });

          if (!wasActive && content) {
            trigger.classList.add('active');
            trigger.setAttribute('aria-expanded', 'true');
            item.classList.add('open');
            openPanel(content);
          }
        });
      });
    });
  });
})();

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

      // Toujours renseigne : le bouton est un <div role="button">, rien d'autre
      // n'annonce l'etat ouvert/ferme.
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    // Etat initial annonce des le chargement.
    hamburger.setAttribute('aria-expanded', 'false');
    
    // Strategy: Use ONLY click event (works on both mobile and desktop)
    // Let the browser handle touch → click conversion naturally
    // NO preventDefault(), NO complex touch logic
    hamburger.addEventListener('click', function(e) {
      toggle();
    });

    // Un <div role="button"> ne convertit pas Entree / Espace en clic :
    // sans ceci le menu est inaccessible au clavier.
    hamburger.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        toggle();
      }
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
  // Compare sans l'extension .html : en production les URL sont propres (/formations-ia)
  const pageName = path => (path.split(/[?#]/)[0].split('/').pop() || 'index').replace(/\.html$/, '');
  const currentPage = pageName(currentPath);
  let matchFound = false;

  links.forEach(link => {
    if (!matchFound && !link.classList.contains('nav-cta') && pageName(link.getAttribute('href')) === currentPage) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
      matchFound = true;
    } else {
      link.classList.remove('active');
      link.removeAttribute('aria-current');
    }
  });
});
