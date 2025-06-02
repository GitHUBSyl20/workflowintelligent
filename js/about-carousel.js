// Wait for DOM and GSAP to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Debug: Check if GSAP and ScrollTrigger are available
  console.log('GSAP available:', !!window.gsap);
  console.log('ScrollTrigger available:', !!window.ScrollTrigger);
  console.log('Carousel track found:', !!document.querySelector('.carousel-track'));

  if (window.gsap && window.ScrollTrigger && document.querySelector('.carousel-track')) {
    gsap.registerPlugin(ScrollTrigger);
    const track = document.querySelector('.carousel-track');
    const outer = document.querySelector('.carousel-outer');

    // Wait for all images to load before calculating widths
    const images = track.querySelectorAll('img');
    let loaded = 0;
    
    console.log('Total images to load:', images.length);

    function initCarousel() {
      // Debug: log dimensions
      console.log('Track dimensions:', {
        scrollWidth: track.scrollWidth,
        clientWidth: outer.clientWidth,
        difference: track.scrollWidth - outer.clientWidth
      });

      gsap.to(track, {
        x: () => -(track.scrollWidth - outer.clientWidth),
        ease: "none",
        scrollTrigger: {
          trigger: ".orange-section",
          start: "top center",
          end: () => `+=${track.scrollWidth - outer.clientWidth}`,
          scrub: true,
          pin: false,
          onUpdate: (self) => {
            // Debug: log scroll progress
            console.log('Scroll progress:', self.progress.toFixed(2));
          }
        }
      });
    }

    // Handle image loading
    images.forEach(img => {
      if (img.complete) {
        loaded++;
        console.log('Image already loaded:', img.src);
      } else {
        img.addEventListener('load', () => {
          loaded++;
          console.log('Image loaded:', img.src, `(${loaded}/${images.length})`);
          if (loaded === images.length) {
            console.log('All images loaded, initializing carousel');
            initCarousel();
          }
        });
        img.addEventListener('error', () => {
          console.error('Failed to load image:', img.src);
          loaded++; // Count failed images too
          if (loaded === images.length) {
            console.log('All images processed, initializing carousel');
            initCarousel();
          }
        });
      }
    });

    // If all images are already loaded
    if (loaded === images.length) {
      console.log('All images already loaded, initializing carousel');
      initCarousel();
    }

    const carouselOuter = document.querySelector('.carousel-outer');
    const carouselTrack = document.querySelector('.carousel-track');

    if (!carouselOuter || !carouselTrack) return;

    function updateCarouselAlignment() {
      const rect = carouselOuter.getBoundingClientRect();
      // When the top of the carousel is near the top of the viewport (e.g., < 40px)
      if (rect.top <= 40) {
        carouselTrack.classList.add('align-left');
      } else {
        carouselTrack.classList.remove('align-left');
      }
    }

    window.addEventListener('scroll', updateCarouselAlignment, { passive: true });
    window.addEventListener('resize', updateCarouselAlignment);
    updateCarouselAlignment();
  } else {
    console.warn('Missing requirements for carousel:', {
      gsap: !!window.gsap,
      scrollTrigger: !!window.ScrollTrigger,
      track: !!document.querySelector('.carousel-track')
    });
  }
}); 