// Debug log: script loaded
console.log('[main.js] Script loaded');

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

document.addEventListener('DOMContentLoaded', function() {
  // Hamburger menu toggle
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.main-nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
      document.body.classList.toggle('menu-open');
    });
    // Close menu when a link is clicked (mobile UX)
    navLinks.querySelectorAll('.main-nav-link').forEach(link => {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
        document.body.classList.remove('menu-open');
      });
    });
  }

  // Active link highlighting - Enhanced version with debugging
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
  const cards = document.querySelectorAll('.feature-card');
  console.log('Number of .feature-card elements:', cards.length);
  cards.forEach((card, idx) => {
    const style = window.getComputedStyle(card);
    console.log(`Card #${idx + 1} display:`, style.display, 'visibility:', style.visibility, 'opacity:', style.opacity);
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