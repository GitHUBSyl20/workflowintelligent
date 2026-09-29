// Webflow Touch Detection
(function (o, c) {
  var n = c.documentElement,
    t = " w-mod-";
  n.className += t + "js";
  ("ontouchstart" in o || (o.DocumentTouch && c instanceof DocumentTouch)) &&
    (n.className += t + "touch");
})(window, document);

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
  $(".portfolio-section .accordion .accordion-trigger").each(function() {
    $(this).attr('aria-expanded', $(this).hasClass('active') ? 'true' : 'false');
  });

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

    // Etat annonce aux technologies d'assistance : tous fermes, puis celui-ci si on l'ouvre.
    $accordion.find('.accordion-trigger').attr('aria-expanded', 'false');

    if (!wasActive) {
      $this.addClass("active");
      $item.addClass("open");
      $this.attr('aria-expanded', 'true');
      
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
