// MINIMAL COOKIE TEST SCRIPT
console.log('🧪 TEST: Cookie test script loaded successfully!');

// Test 1: Check if DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🧪 TEST: DOM is ready');
    
    // Test 2: Check if modal HTML exists
    const modal = document.getElementById('cookie-modal');
    console.log('🧪 TEST: Cookie modal element found:', !!modal);
    
    if (modal) {
        console.log('🧪 TEST: Modal HTML structure exists');
        
        // Test 3: Try to show modal immediately
        modal.style.display = 'flex';
        modal.style.opacity = '1';
        modal.style.visibility = 'visible';
        modal.classList.add('show');
        
        console.log('🧪 TEST: Attempting to force show modal with inline styles');
        
        // Test 4: Check if CSS is loading
        const computedStyle = window.getComputedStyle(modal);
        console.log('🧪 TEST: Modal computed display:', computedStyle.display);
        console.log('🧪 TEST: Modal computed opacity:', computedStyle.opacity);
        console.log('🧪 TEST: Modal computed visibility:', computedStyle.visibility);
        
        // Test 5: Add click handler to close
        const closeBtn = modal.querySelector('.cookie-modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
                console.log('🧪 TEST: Modal closed via close button');
            });
        }
        
        // Test 6: Add click handler to accept button
        const acceptBtn = modal.querySelector('.cookie-btn-accept');
        if (acceptBtn) {
            acceptBtn.addEventListener('click', function() {
                modal.style.display = 'none';
                console.log('🧪 TEST: Modal closed via accept button');
                alert('🍪 Cookie test: Accept button works!');
            });
        }
    } else {
        console.error('🧪 TEST: Modal HTML element not found in DOM!');
    }
});

// Test 7: Check if running from file:// protocol
console.log('🧪 TEST: Current protocol:', window.location.protocol);
console.log('🧪 TEST: Current origin:', window.location.origin);

if (window.location.protocol === 'file:') {
    console.warn('🧪 TEST: Running from file:// protocol - this may cause issues with loading resources');
} 