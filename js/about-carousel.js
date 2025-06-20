// Wait for DOM and GSAP to be ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded - checking for carousel');
  
  // Get carousel elements
  const track = document.querySelector('.carousel-track');
  const carousel = document.querySelector('.header-carousel');
  
  if (!track || !carousel) {
    console.error('Carousel elements not found');
    return;
  }
  
  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;
  console.log('Device detection:', isMobile ? 'Mobile' : 'Desktop');
  
  // Count images
  const images = track.querySelectorAll('img');
  console.log('Found', images.length, 'carousel images');
  
  // Exit early on mobile
  if (isMobile) {
    console.log('Mobile detected, using native scrolling');
    return;
  }
  
  // APPROACH 1: PURE JAVASCRIPT SCROLL-BASED ANIMATION
  // This will work even if GSAP fails to load
  
  // Calculate the starting position (centered)
  const trackWidth = track.scrollWidth;
  const viewportWidth = window.innerWidth;
  const startPosition = (viewportWidth - trackWidth) / 2;
  
  // Set initial position with inline style
  track.style.transform = `translateX(${startPosition}px)`;
  
  console.log('Initial position set to:', startPosition);
  
  // Calculate the maximum scroll amount
  const maxScroll = 2000; // Maximum pixels to move
  
  // Add scroll event listener
  window.addEventListener('scroll', function() {
    // Calculate scroll percentage (0 to 1)
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollTop = window.scrollY;
    const scrollPercent = Math.min(scrollTop / scrollHeight, 1);
    
    // Calculate new position
    const moveAmount = startPosition - (maxScroll * scrollPercent);
    
    // Apply new position
    track.style.transform = `translateX(${moveAmount}px)`;
    
    // Log every 10% change
    if (Math.floor(scrollPercent * 10) !== Math.floor(lastScrollPercent * 10)) {
      console.log('Scroll:', Math.round(scrollPercent * 100) + '%', 'Position:', Math.round(moveAmount));
      lastScrollPercent = scrollPercent;
    }
  });
  
  // Track last scroll percentage to reduce logging
  let lastScrollPercent = 0;
  
  // APPROACH 2: TRY GSAP IF AVAILABLE
  // This will run in parallel but only take effect if GSAP loads
  
  function tryGSAPAnimation() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      console.log('GSAP detected, setting up animation');
      
      // Register ScrollTrigger
      gsap.registerPlugin(ScrollTrigger);
      
      // Kill any existing ScrollTriggers
      ScrollTrigger.getAll().forEach(st => st.kill());
      
      // Create simple animation
      gsap.fromTo(track, 
        { x: startPosition }, 
        { 
          x: startPosition - maxScroll,
          ease: "none",
          scrollTrigger: {
            trigger: "body",
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
            onUpdate: function(self) {
              console.log('GSAP progress:', Math.round(self.progress * 100) + '%');
            }
          }
        }
      );
      
      console.log('GSAP animation setup complete');
    } else {
      // Try again in a moment
      setTimeout(tryGSAPAnimation, 500);
    }
  }
  
  // Try to set up GSAP animation
  setTimeout(tryGSAPAnimation, 500);
}); 