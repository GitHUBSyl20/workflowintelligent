# Technical Debt & Improvements Tracker

This file lists all optimizations, best practices, and improvements to address before or after launch.

## JavaScript
- [ ] Remove jQuery dependency and rewrite tab logic in vanilla JS
- [ ] Minify `js/main.js` and any other custom scripts
- [ ] Bundle and minify all JS assets
- [ ] Clean JS file

## CSS
- [ ] Remove unused CSS (manual or with PurgeCSS)
- [ ] Minify all CSS files
- [ ] Combine CSS files to reduce HTTP requests
- [ ] Make the font homogenous
- [ ] Make the burger menu closing in mobile versionn
- [ ] Make the menu take all the available space in mobile
- [ ] Remove horrible webfont classes !
- [ ] Cohérence largeur de texte et position

## Images
- [ ] Compress all images (use WebP/AVIF where possible)
- [ ] Ensure all images use responsive `srcset` and `sizes`
- [ ] Audit for missing or poor `alt` attributes
- [ ] better icons /images

## Accessibility
- [ ] Run an accessibility audit (e.g., Lighthouse, axe)
- [ ] Ensure all interactive elements are keyboard accessible
- [ ] Check color contrast and ARIA labels
- [ ] Click link sends to haut de page

## HTML & SEO
- [ ] Validate all HTML (W3C validator)
- [ ] Add/verify meta tags for SEO and social sharing
- [ ] Add structured data (JSON-LD) if relevant

## Performance
- [ ] Enable browser caching for static assets
- [ ] Use a CDN for static files (on deployment)
- [ ] Optimize font loading (e.g., `font-display: swap`)

## Security
- [ ] Serve site over HTTPS
- [ ] Set security headers (CSP, X-Frame-Options, etc.)

## Code Quality
- [ ] Run linter/formatter (e.g., Prettier, ESLint)
- [ ] Remove any remaining dead/commented-out code
- [ ] Add/verify code comments and documentation

## Deployment
- [ ] Automate build/minification (npm scripts, build tool)
- [ ] Deploy to Netlify, Vercel, or similar
- [ ] Set up custom domain and HTTPS

## Analytics & Monitoring
- [ ] Add analytics (Google Analytics, Plausible, etc.)
- [ ] Set up error monitoring (Sentry, etc.)

## Sanitize imputs field
## Prepare for deployment optimization
## Add a Mention légales et RGPD
## Hard test responsivity
---

**Update this file as you address or add new improvements!** 