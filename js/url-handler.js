/**
 * URL Handler - Gestion dynamique des URLs selon l'environnement
 * - En local : Garde les extensions .html
 * - En production : Retire les extensions .html pour des URLs propres
 */

(function() {
    'use strict';
    
    // Détection de l'environnement
    const isProduction = window.location.hostname === 'workflowintelligent.com' || 
                        window.location.hostname.includes('vercel.app');
    
    const isLocal = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.protocol === 'file:';
    
    // Liste des pages avec leurs URLs optimisées
    const urlMappings = {
        'solutions-ia-entreprise.html': 'solutions-ia-entreprise',
        'automatisation-entreprise.html': 'automatisation-entreprise',
        'aides-financement-numerique.html': 'aides-financement-numerique',
        'tarifs-prestations.html': 'tarifs-prestations',
        'contact-devis.html': 'contact-devis',
        'a-propos.html': 'a-propos',
        'mentions-legales.html': 'mentions-legales',
        'conditions-generales.html': 'conditions-generales',
        'formations-ia.html': 'formations-ia',
        'index.html': '',
        // English versions
        'solutions-ia-entreprise-en.html': 'solutions-ia-entreprise-en',
        'automatisation-entreprise-en.html': 'automatisation-entreprise-en',
        'aides-financement-numerique-en.html': 'aides-financement-numerique-en',
        'tarifs-prestations-en.html': 'tarifs-prestations-en',
        'contact-devis-en.html': 'contact-devis-en',
        'a-propos-en.html': 'a-propos-en',
        'mentions-legales-en.html': 'mentions-legales-en',
        'conditions-generales-en.html': 'conditions-generales-en',
        'index-en.html': 'index-en'
    };
    
    // Fonction pour nettoyer les URLs en production
    function cleanUrls() {
        if (!isProduction) return; // Ne s'exécute qu'en production
        
        // Nettoyer tous les liens internes
        const links = document.querySelectorAll('a[href*=".html"]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // Ignorer les liens externes et les ancres
            if (href.startsWith('http') || href.startsWith('mailto:') || href.includes('#')) {
                return;
            }

            // Normaliser la clé de mapping (retire le / initial si présent)
            const mappingKey = href.replace(/^\//, '');
            const mapped = urlMappings[mappingKey];

            // Si un mapping existe, l'utiliser pour générer une URL propre
            if (typeof mapped !== 'undefined') {
                const normalized = mapped === '' ? '/' : `/${mapped}`;
                link.setAttribute('href', normalized);
                return;
            }

            // Retirer l'extension .html (mais garder -en si présent) puis forcer une URL absolue
            let cleanHref = href.replace('.html', '');
            if (cleanHref === 'index' || cleanHref === './index' || cleanHref === '/index') {
                cleanHref = '/';
            } else if (cleanHref === 'index-en' || cleanHref === './index-en' || cleanHref === '/index-en') {
                cleanHref = '/index-en';
            } else if (!cleanHref.startsWith('/')) {
                cleanHref = `/${cleanHref}`;
            }

            link.setAttribute('href', cleanHref);
        });
        
    }
    
    // Fonction pour mettre à jour l'URL courante si nécessaire
    function updateCurrentUrl() {
        if (!isProduction) return;
        
        const currentPath = window.location.pathname;
        
        // Si l'URL contient .html, rediriger vers la version propre
        if (currentPath.includes('.html')) {
            const cleanPath = currentPath.replace('.html', '');
            // Gérer index.html mais pas index-en.html
            const finalPath = (cleanPath === '/index' || cleanPath === 'index') ? '/' : cleanPath;
            
            // Redirection avec history.replaceState pour éviter un rechargement
            history.replaceState(null, null, finalPath + window.location.search + window.location.hash);
        }
    }
    
    // Exécution au chargement de la page
    document.addEventListener('DOMContentLoaded', function() {
        updateCurrentUrl();
        cleanUrls();
        
    });
    
    // Observer pour les contenus chargés dynamiquement
    function startObserver() {
        const target = document.body;
        if (!isProduction || !target) {
            if (!target) {
                console.warn('[url-handler] body not ready, skipping observer init');
            }
            return;
        }
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Re-nettoyer les nouveaux liens ajoutés
                    setTimeout(cleanUrls, 100);
                }
            });
        });
        observer.observe(target, {
            childList: true,
            subtree: true
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserver);
    } else {
        startObserver();
    }
    
})(); 
