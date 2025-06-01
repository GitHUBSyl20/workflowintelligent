// Debug log: script loaded

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

document.addEventListener('DOMContentLoaded', function() {
  // Hamburger menu toggle
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.main-nav-links');
  if (!hamburger) {
  }
  if (!navLinks) {
  }
  try {
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('open');
        hamburger.classList.toggle('active');
      });
      document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('open');
          hamburger.classList.remove('active');
        }
      });
      const navItems = navLinks.querySelectorAll('a');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          navLinks.classList.remove('open');
          hamburger.classList.remove('active');
        });
      });
    }
  } catch (err) {
  }

  // Active link highlighting
  const links = document.querySelectorAll('.main-nav-link');
  const current = window.location.pathname.split('/').pop();
  links.forEach(link => {
    if(link.getAttribute('href') === current) {
      link.classList.add('active');
    }
  });

  // GSAP animation for feature cards
  if (window.gsap && document.querySelector('.feature-card')) {
    if (window.gsap.registerPlugin && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
    }
    gsap.to('.feature-card', {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.18,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '.feature-cards-section',
        start: 'top 80%',
        once: true
      }
    });
  }
});