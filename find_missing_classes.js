const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// Paths
const htmlDir = '.'; // Current directory
const cssFile = 'css/clean-shared.css';

// Read clean-shared.css and extract class selectors
const cssContent = fs.readFileSync(cssFile, 'utf8');
const cssClasses = new Set();
const cssClassRegex = /\.([a-zA-Z0-9_-]+)\b/g;
let match;
while ((match = cssClassRegex.exec(cssContent)) !== null) {
  cssClasses.add(match[1]);
}

// Read all HTML files and extract class names
const htmlClasses = new Set();
const htmlFiles = fs.readdirSync(htmlDir).filter(file => file.endsWith('.html'));
htmlFiles.forEach(file => {
  const htmlContent = fs.readFileSync(path.join(htmlDir, file), 'utf8');
  const $ = cheerio.load(htmlContent);
  $('[class]').each((_, el) => {
    const classes = $(el).attr('class').split(/\s+/);
    classes.forEach(cls => htmlClasses.add(cls));
  });
});

// Find classes used in HTML but not in clean-shared.css
const missingClasses = [...htmlClasses].filter(cls => !cssClasses.has(cls));

console.log('Classes used in HTML but not defined in clean-shared.css:');
console.log(missingClasses); 