// Custom JavaScript for DigitalAIchemy website

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initTabs();
    initNavigation();
    initScrollEffects();
});

// Tab functionality for custom tab system
function initTabs() {
    document.querySelectorAll('.tabs').forEach(function (tabs) {
        const links = tabs.querySelectorAll('.tab-link');
        const panes = tabs.querySelectorAll('.tab-pane');
        links.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                // Remove active from all
                links.forEach(l => l.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                // Add active to clicked and corresponding pane
                this.classList.add('active');
                const target = tabs.querySelector(this.getAttribute('href'));
                if (target) target.classList.add('active');
            });
        });
    });
}

// Navigation menu
function initNavigation() {
    const hamburger = document.querySelector('.nav-hamburger');
    const mainNavLinks = document.querySelector('.main-nav-links');
    
    if (hamburger && mainNavLinks) {
        // Toggle menu on hamburger click
        hamburger.addEventListener('click', () => {
            mainNavLinks.classList.toggle('open');
            hamburger.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mainNavLinks.contains(e.target)) {
                mainNavLinks.classList.remove('open');
                hamburger.classList.remove('active');
            }
        });

        // Close menu when clicking a link
        const navItems = mainNavLinks.querySelectorAll('a');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                mainNavLinks.classList.remove('open');
                hamburger.classList.remove('active');
            });
        });
    }

    // Highlight active nav link
    const currentPage = window.location.pathname.split('/').pop();
    const navLinkElements = document.querySelectorAll('.main-nav-link');
    navLinkElements.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Scroll effects
function initScrollEffects() {
    // Add shadow to navbar on scroll
    const navbar = document.querySelector('.main-navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 0) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility function to check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Add touch detection class to html element
(function(o, c) {
    var n = c.documentElement,
        t = " w-mod-";
    n.className += t + "js";
    ("ontouchstart" in o || (o.DocumentTouch && c instanceof DocumentTouch)) &&
        (n.className += t + "touch");
})(window, document); 