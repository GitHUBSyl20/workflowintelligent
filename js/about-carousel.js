// Wait for DOM and GSAP to be ready
document.addEventListener('DOMContentLoaded', function() {
  
  
  // Get carousel elements
  const track = document.querySelector('.carousel-track');
  const carousel = document.querySelector('.header-carousel');
  
  if (!track || !carousel) {
   
    return;
  }
  
  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;
  
  // MOBILE: Effet de zoom progressif sur l'image CarréCarré
  if (isMobile) {
    const mepro2Image = document.querySelector('.img-mepro2');
    
    if (mepro2Image && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
      
      // Animation de zoom progressif au scroll
      gsap.fromTo(mepro2Image, 
        { 
          scale: 2.5,
          rotation: 0
        }, 
        { 
          scale: 3.2,
          rotation: 3,
          ease: "power1.out",
          scrollTrigger: {
            trigger: carousel,
            start: "top bottom",
            end: "bottom top",
            scrub: 1
          }
        }
      );
    }
    return;
  }
  
  // APPROACH 1: PURE JAVASCRIPT SCROLL-BASED ANIMATION
  // This will work even if GSAP fails to load
  
  // Set starting position to show the first image on the left
  const startPosition = 0;
  
  // Set initial position with inline style
  track.style.transform = `translateX(${startPosition}px)`;
  
  // Calculate the maximum scroll amount
  const maxScroll = 1000; // Adjust max scroll to show all images
  
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
    
    // Track scroll percentage
    if (Math.floor(scrollPercent * 10) !== Math.floor(lastScrollPercent * 10)) {
      lastScrollPercent = scrollPercent;
    }
  });
  
  // Track last scroll percentage to reduce logging
  let lastScrollPercent = 0;
  
  // APPROACH 2: TRY GSAP IF AVAILABLE
  // This will run in parallel but only take effect if GSAP loads
  
  function tryGSAPAnimation() {
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
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
            scrub: 1
          }
        }
      );
    } else {
      // Try again in a moment
      setTimeout(tryGSAPAnimation, 500);
    }
  }
  
  // Try to set up GSAP animation
  setTimeout(tryGSAPAnimation, 500);
}); 