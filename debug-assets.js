// Asset Debug Script - Add this to your HTML pages temporarily
console.log('🔍 Asset Debug - Starting verification...');

// Test critical assets
const criticalAssets = [
  '/assets/LogoWflow.webp',
  '/assets/AI-remove2.webp',
  '/assets/ContactMe.webp',
  '/assets/About.webp',
  '/assets/automation2.webp',
  '/assets/Offres-Cart.webp'
];

let loadedCount = 0;
let failedCount = 0;

criticalAssets.forEach(asset => {
  const img = new Image();
  img.onload = () => {
    loadedCount++;
    console.log(`✅ ${asset} - Loaded successfully`);
    checkCompletion();
  };
  img.onerror = () => {
    failedCount++;
    console.error(`❌ ${asset} - Failed to load`);
    checkCompletion();
  };
  img.src = asset;
});

function checkCompletion() {
  if (loadedCount + failedCount === criticalAssets.length) {
    console.log(`\n📊 Asset Loading Summary:`);
    console.log(`✅ Successfully loaded: ${loadedCount}/${criticalAssets.length}`);
    console.log(`❌ Failed to load: ${failedCount}/${criticalAssets.length}`);
    
    if (failedCount > 0) {
      console.error('🚨 ASSET LOADING ISSUES DETECTED!');
      console.error('Check your Vercel deployment and asset paths.');
    } else {
      console.log('🎉 All assets loaded successfully!');
    }
  }
}

// Test environment info
console.log('🌐 Environment Info:', {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  isProduction: !window.location.hostname.includes('localhost')
});
