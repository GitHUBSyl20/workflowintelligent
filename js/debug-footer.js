document.addEventListener('DOMContentLoaded', function() {
  console.log('Attempting to apply footer styles via debug-footer.js...');
  const footer = document.querySelector('.inverse-footer');
  if (footer) {
    console.log('Footer element found on this page. Applying styles via script.');
    footer.style.backgroundColor = '#192a56'; // Deep Navy Blue
  } else {
    console.log('Footer element with class "inverse-footer" not found on this page.');
  }
}); 