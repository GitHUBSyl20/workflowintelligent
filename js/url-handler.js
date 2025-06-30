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
        'index.html': ''
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
            
            // Retirer l'extension .html
            const cleanHref = href.replace('.html', '');
            
            // Cas spécial pour index.html -> /
            if (cleanHref === 'index' || cleanHref === './index' || cleanHref === '/index') {
                link.setAttribute('href', '/');
            } else {
                link.setAttribute('href', cleanHref);
            }
        });
        
        console.log('🚀 URLs nettoyées pour la production');
    }
    
    // Fonction pour mettre à jour l'URL courante si nécessaire
    function updateCurrentUrl() {
        if (!isProduction) return;
        
        const currentPath = window.location.pathname;
        
        // Si l'URL contient .html, rediriger vers la version propre
        if (currentPath.includes('.html')) {
            const cleanPath = currentPath.replace('.html', '');
            const finalPath = cleanPath === '/index' ? '/' : cleanPath;
            
            // Redirection avec history.replaceState pour éviter un rechargement
            history.replaceState(null, null, finalPath + window.location.search + window.location.hash);
        }
    }
    
    // Exécution au chargement de la page
    document.addEventListener('DOMContentLoaded', function() {
        updateCurrentUrl();
        cleanUrls();
        
        // Info de debug (à retirer en production finale)
        if (isLocal) {
            console.log('🏠 Environnement LOCAL - URLs avec .html conservées');
        } else if (isProduction) {
            console.log('🌐 Environnement PRODUCTION - URLs nettoyées');
        }
    });
    
    // Observer pour les contenus chargés dynamiquement
    const observer = new MutationObserver(function(mutations) {
        if (isProduction) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Re-nettoyer les nouveaux liens ajoutés
                    setTimeout(cleanUrls, 100);
                }
            });
        }
    });
    
    // Démarrer l'observation
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
})(); 