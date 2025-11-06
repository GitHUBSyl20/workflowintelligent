/**
 * Cookie Consent Manager
 * Handles GDPR-compliant cookie consent for the website
 */

class CookieConsent {
  constructor() {
    this.STORAGE_KEY = 'cookieConsent';
    this.CONSENT_EXPIRY = 365; // days
    this.modal = null;
    this.languageManager = null;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.modal = document.getElementById('cookie-modal');
    if (!this.modal) {
      return;
    }
    
    // Wait for language manager to be ready
    if (window.LanguageManager) {
      this.languageManager = window.LanguageManager;
      this.translateModal();
    } else {
      document.addEventListener('languageManagerReady', () => {
        this.languageManager = window.LanguageManager;
        this.translateModal();
      });
    }
    
    this.bindEvents();
    this.checkConsent();
  }

  translateModal() {
    if (!this.languageManager || !this.modal) {
      return;
    }

    const lang = this.languageManager.getCurrentLanguage();
    const t = (key) => this.languageManager.get(`common.cookieConsent.${key}`);

    // Update modal title
    const title = this.modal.querySelector('.cookie-modal-header h3');
    if (title) title.textContent = t('title');

    // Update close button aria-label
    const closeBtn = this.modal.querySelector('.cookie-modal-close');
    if (closeBtn) closeBtn.setAttribute('aria-label', lang === 'fr' ? 'Fermer' : 'Close');

    // Update description
    const description = this.modal.querySelector('.cookie-modal-body > p:first-child');
    if (description) description.textContent = t('description');

    // Update essential cookies
    const essentialTitle = this.modal.querySelector('.cookie-type:first-child strong');
    const essentialDesc = this.modal.querySelector('.cookie-type:first-child p');
    if (essentialTitle) essentialTitle.textContent = t('essentialTitle');
    if (essentialDesc) essentialDesc.textContent = t('essentialDesc');

    // Update analytics cookies
    const analyticsTitle = this.modal.querySelector('.cookie-type:nth-child(2) strong');
    const analyticsDesc = this.modal.querySelector('.cookie-type:nth-child(2) p');
    if (analyticsTitle) analyticsTitle.textContent = t('analyticsTitle');
    if (analyticsDesc) analyticsDesc.textContent = t('analyticsDesc');

    // Update legal notice
    const legalNotice = this.modal.querySelector('.legal-notice');
    if (legalNotice) {
      const legalLink = legalNotice.querySelector('a[href*="mentions-legales"]');
      const termsLink = legalNotice.querySelector('a[href*="conditions-generales"]');
      
      legalNotice.innerHTML = t('legalNotice') + ' ';
      
      if (legalLink && termsLink) {
        const newLegalLink = document.createElement('a');
        newLegalLink.href = legalLink.href;
        newLegalLink.target = '_blank';
        newLegalLink.textContent = t('legalLink');
        
        const newTermsLink = document.createElement('a');
        newTermsLink.href = termsLink.href;
        newTermsLink.target = '_blank';
        newTermsLink.textContent = t('termsLink');
        
        legalNotice.appendChild(newLegalLink);
        legalNotice.appendChild(document.createTextNode(' ' + (lang === 'fr' ? 'et mes' : 'and my') + ' '));
        legalNotice.appendChild(newTermsLink);
        legalNotice.appendChild(document.createTextNode('.'));
      }
    }

    // Update buttons
    const acceptBtn = this.modal.querySelector('.cookie-btn-accept');
    const essentialBtn = this.modal.querySelector('.cookie-btn-essential');
    const declineBtn = this.modal.querySelector('.cookie-btn-decline');
    
    if (acceptBtn) acceptBtn.textContent = t('acceptAll');
    if (essentialBtn) essentialBtn.textContent = t('essentialOnly');
    if (declineBtn) declineBtn.textContent = t('decline');
  }

  bindEvents() {
    const acceptBtn = this.modal.querySelector('.cookie-btn-accept');
    if (acceptBtn) {
      acceptBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleAcceptAll();
      });
    }

    const essentialBtn = this.modal.querySelector('.cookie-btn-essential');
    if (essentialBtn) {
      essentialBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleEssentialOnly();
      });
    }

    const declineBtn = this.modal.querySelector('.cookie-btn-decline');
    if (declineBtn) {
      declineBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDecline();
      });
    }

    const closeBtn = this.modal.querySelector('.cookie-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.hideModal();
      });
    }

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('show')) {
        this.hideModal();
      }
    });
  }

  checkConsent() {
    const consent = this.getStoredConsent();
    if (!consent || this.isConsentExpired(consent)) {
      setTimeout(() => this.showModal(), 1000);
    } else {
      this.applyCookieSettings(consent);
    }
  }

  getStoredConsent() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  isConsentExpired(consent) {
    if (!consent || !consent.timestamp) return true;
    const expiryDate = new Date(consent.timestamp);
    expiryDate.setDate(expiryDate.getDate() + this.CONSENT_EXPIRY);
    return new Date() > expiryDate;
  }

  storeConsent(preferences) {
    const consent = {
      essential: true, // Always true
      analytics: preferences.analytics || false,
      marketing: preferences.marketing || false,
      timestamp: new Date().toISOString()
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(consent));
    } catch (error) {
      // Silent error handling
    }
    return consent;
  }

  handleAcceptAll() {
    const consent = this.storeConsent({ analytics: true, marketing: true });
    this.applyCookieSettings(consent);
    this.hideModal();
    const message = this.languageManager ? 
      this.languageManager.get('common.cookieConsent.notificationAccepted') :
      'Tous les cookies ont été acceptés.';
    this.showNotification(message);
  }

  handleEssentialOnly() {
    const consent = this.storeConsent({ analytics: false, marketing: false });
    this.applyCookieSettings(consent);
    this.hideModal();
    const message = this.languageManager ?
      this.languageManager.get('common.cookieConsent.notificationEssential') :
      'Seuls les cookies essentiels ont été acceptés.';
    this.showNotification(message);
  }

  handleDecline() {
    const consent = this.storeConsent({ analytics: false, marketing: false });
    this.applyCookieSettings(consent);
    this.hideModal();
    const message = this.languageManager ?
      this.languageManager.get('common.cookieConsent.notificationDeclined') :
      'Les cookies ont été refusés.';
    this.showNotification(message);
  }

  applyCookieSettings(consent) {
    if (!consent.analytics) {
      this.removeAnalyticsCookies();
    }
    if (!consent.marketing) {
      this.removeMarketingCookies();
    }
    document.dispatchEvent(new CustomEvent('cookieConsentUpdated', { detail: consent }));
  }

  removeAnalyticsCookies() {
    const analyticsCookies = ['_ga', '_ga_', '_gid', '_gat', '_gtag'];
    analyticsCookies.forEach(cookie => this.removeCookie(cookie));
  }

  removeMarketingCookies() {
    const marketingCookies = ['_fbp', '_fbc', 'fr'];
    marketingCookies.forEach(cookie => this.removeCookie(cookie));
  }

  removeCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    const domain = window.location.hostname;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${domain}`;
  }

  showModal() {
    if (!this.modal) return;
    this.modal.classList.add('show');
    const firstFocusable = this.modal.querySelector('.cookie-btn-accept');
    if (firstFocusable) firstFocusable.focus();
    document.body.style.overflow = 'hidden';
  }

  hideModal() {
    if (!this.modal) return;
    this.modal.classList.remove('show');
    document.body.style.overflow = '';
  }

  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; background: #28a745; color: white;
      padding: 1rem 1.5rem; border-radius: 0.5rem; z-index: 10001; font-size: 0.9rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1); opacity: 0; transform: translateX(100%);
      transition: all 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => notification.parentNode?.removeChild(notification), 300);
    }, 3000);
  }

  getConsent() {
    return this.getStoredConsent();
  }

  showSettings() {
    this.showModal();
  }

  resetConsent() {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this.showModal();
    } catch (error) {
      // Silent error handling
    }
  }
}

const cookieConsent = new CookieConsent();
window.CookieConsent = cookieConsent;

document.addEventListener('cookieConsentUpdated', (event) => {
  const consent = event.detail;
  if (consent.analytics) {
    // Analytics cookies accepted - you can load GA here
  }
  if (consent.marketing) {
    // Marketing cookies accepted - you can load FB Pixel here
  }
}); 