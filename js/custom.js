// Custom JavaScript for DigitalAIchemy website


// reCAPTCHA callback function - GLOBAL VERSION
function onRecaptchaSuccess() {
    // This function is called when reCAPTCHA is completed
    // The actual button enabling is handled by checkFormValidation()
    checkFormValidation();
}

// Fallback function if reCAPTCHA fails to load
function onRecaptchaError() {
    console.error('reCAPTCHA failed to load');
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.backgroundColor = '#FF4B1F';
        submitBtn.style.cursor = 'pointer';
    }
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initTabs();
    initScrollEffects();
    initContactForm();
    initImageLoadingDebug();
});

// Image loading debug function
function initImageLoadingDebug() {
    console.log('🔍 Image Loading Debug - Starting analysis...');
    console.log('🌐 Current environment:', {
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        pathname: window.location.pathname,
        isProduction: !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
    });

    // Track all images on the page
    const images = document.querySelectorAll('img');
    console.log(`📸 Found ${images.length} images on the page`);

    images.forEach((img, index) => {
        const src = img.src || img.getAttribute('src');
        const alt = img.alt;
        
        console.log(`🖼️ Image ${index + 1}:`, {
            src: src,
            alt: alt,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight
        });

        // Add event listeners to track loading
        img.addEventListener('load', function() {
            console.log(`✅ Image loaded successfully: ${src}`);
        });

        img.addEventListener('error', function() {
            console.error(`❌ Image failed to load: ${src}`);
            console.error('Error details:', {
                src: src,
                alt: alt,
                complete: img.complete,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight
            });
        });

        // Check if image is already loaded
        if (img.complete) {
            if (img.naturalWidth === 0) {
                console.error(`❌ Image appears broken (0x0): ${src}`);
            } else {
                console.log(`✅ Image already loaded: ${src}`);
            }
        }
    });

    // Test asset path accessibility
    testAssetPathAccess();
}

// Test if assets directory is accessible
function testAssetPathAccess() {
    console.log('🧪 Testing asset path accessibility...');
    
    // Test a known asset
    const testImage = new Image();
    testImage.onload = function() {
        console.log('✅ Asset path test successful - /assets/ directory is accessible');
    };
    testImage.onerror = function() {
        console.error('❌ Asset path test failed - /assets/ directory not accessible');
        console.error('This suggests a production deployment issue with asset serving');
    };
    
    // Test with a known asset from the assets directory
    testImage.src = '/assets/AI-remove2.webp';
}

// Tab functionality for custom tab system
function initTabs() {
    document.querySelectorAll('.tabs').forEach(function (tabs) {
        const links = tabs.querySelectorAll('.tab-link');
        const panes = tabs.querySelectorAll('.tab-pane');
        links.forEach(link => {
            link.addEventListener('click', function (e) {
                e.preventDefault();
                // Remove active from all
                links.forEach(l => l.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));
                // Add active to clicked and corresponding pane
                this.classList.add('active');
                const target = tabs.querySelector(this.getAttribute('href'));
                if (target) target.classList.add('active');
            });
        });
    });
}

// Scroll effects
function initScrollEffects() {
    // Add shadow to navbar on scroll
    const navbar = document.querySelector('.main-navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 0) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Utility function to check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Initialize contact form with comprehensive security
function initContactForm() {
    const form = document.getElementById('email-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusDiv = document.getElementById('form-status');
    const formToken = document.getElementById('form-token');
    
    // Security variables
    let submissionCount = 0;
    let lastSubmissionTime = 0;
    const MAX_SUBMISSIONS = 3;
    const TIME_WINDOW = 60000; // 1 minute
    const MIN_TIME_BETWEEN_SUBMISSIONS = 3000; // 3 seconds

    if (form && formToken) {
        // Check if we're in development mode (no reCAPTCHA)
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' || 
                             window.location.hostname === '[::]' ||
                             window.location.hostname.includes('local') ||
                             window.location.hostname === '';
        
        // Initialize submit button as disabled
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = '#ccc';
            submitBtn.style.cursor = 'not-allowed';
        }

        // Check if we're returning from a successful submission
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success') === '1') {
            showStatus('✅ Message envoyé avec succès ! Vérifiez votre email (et le dossier spam) dans quelques minutes.', 'success');
            // Clean the URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
        }

        // Generate form token after small delay (anti-bot measure)
        setTimeout(() => {
            formToken.value = generateSecureToken();
        }, 1000);

        // Add real-time input validation and button state management
        addInputValidation();
        addFormValidation();
        
        // Add form submission security
        form.addEventListener('submit', function(e) {
            // Check if reCAPTCHA is completed (only if grecaptcha is available and not in development)
            if (!isDevelopment && typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
                const recaptchaResponse = grecaptcha.getResponse();
                if (!recaptchaResponse) {
                    e.preventDefault();
                    showStatus('Veuillez compléter le reCAPTCHA avant d\'envoyer le formulaire.', 'error');
                    return;
                }
            }

            // Basic security validation
            if (!validateFormSecurity(e)) {
                return;
            }

            // Show loading state
            submitBtn.disabled = true;
            submitBtn.value = 'Envoi en cours...';
            submitBtn.style.backgroundColor = '#ccc';
            statusDiv.style.display = 'none';

            // Track submission
            submissionCount++;
            lastSubmissionTime = Date.now();

            // Show status message
            setTimeout(() => {
                showStatus('Envoi en cours vers sylvainmagana@ymail.com...', 'info');
            }, 100);

            // Handle form submission result
            setTimeout(() => {
                showStatus('Formulaire envoyé ! Vérifiez votre dossier spam si vous ne recevez pas d\'email.', 'success');
                
                // Reset form and re-enable button
                submitBtn.disabled = true; // Keep disabled until reCAPTCHA is completed again
                submitBtn.value = 'Envoyez';
                submitBtn.style.backgroundColor = '#ccc';
                submitBtn.style.cursor = 'not-allowed';
                
                // Clear form after successful submission
                form.reset();
                formToken.value = generateSecureToken();
                
                // Reset reCAPTCHA (only if available and not in development)
                if (!isDevelopment && typeof grecaptcha !== 'undefined' && grecaptcha.reset) {
                    grecaptcha.reset();
                }
                
                // Re-check form validation after reset
                setTimeout(() => {
                    checkFormValidation();
                }, 100);
            }, 3000);
        });
    }

    function validateFormSecurity(e) {
        const now = Date.now();
        
        // Check honeypot field
        const honeypot = document.getElementById('website');
        if (honeypot && honeypot.value.length > 0) {
            e.preventDefault();
            showStatus('Soumission bloquée - comportement suspect détecté.', 'error');
            return false;
        }

        // Rate limiting check
        if (submissionCount >= MAX_SUBMISSIONS) {
            const timeSinceFirst = now - (lastSubmissionTime - TIME_WINDOW);
            if (timeSinceFirst < TIME_WINDOW) {
                e.preventDefault();
                showStatus('Trop de tentatives. Veuillez attendre avant de réessayer.', 'error');
                return false;
            } else {
                // Reset counter after time window
                submissionCount = 0;
            }
        }

        // Minimum time between submissions
        if (now - lastSubmissionTime < MIN_TIME_BETWEEN_SUBMISSIONS && submissionCount > 0) {
            e.preventDefault();
            showStatus('Veuillez attendre quelques secondes avant de renvoyer.', 'error');
            return false;
        }

        // Validate form token
        if (!formToken.value || formToken.value.length < 10) {
            e.preventDefault();
            showStatus('Erreur de sécurité. Veuillez recharger la page.', 'error');
            return false;
        }

        // Additional content validation
        if (!validateFormContent()) {
            e.preventDefault();
            return false;
        }

        return true;
    }

    function validateFormContent() {
        const nom = document.getElementById('Nom').value;
        const prenom = document.getElementById('Pr-nom').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('Commentaires').value;

        // Check for suspicious patterns
        const suspiciousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
            /\beval\s*\(/gi,
            /document\.cookie/gi,
            /window\.location/gi
        ];

        const allContent = nom + ' ' + prenom + ' ' + email + ' ' + message;
        
        for (let pattern of suspiciousPatterns) {
            if (pattern.test(allContent)) {
                showStatus('Contenu suspect détecté. Veuillez vérifier votre saisie.', 'error');
                return false;
            }
        }

        // Check for excessive special characters (potential injection)
        const specialCharCount = (allContent.match(/[<>{}[\]\\\/]/g) || []).length;
        if (specialCharCount > 5) {
            showStatus('Trop de caractères spéciaux détectés.', 'error');
            return false;
        }

        // Check for very long URLs (potential spam)
        const urlPattern = /https?:\/\/[^\s]+/g;
        const urls = allContent.match(urlPattern) || [];
        if (urls.some(url => url.length > 100)) {
            showStatus('URLs trop longues détectées.', 'error');
            return false;
        }

        return true;
    }

    function addInputValidation() {
        // Real-time input sanitization
        const textInputs = ['Nom', 'Pr-nom'];
        textInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', function() {
                    // Remove potentially dangerous characters
                    this.value = this.value.replace(/[<>{}[\]\\\/]/g, '');
                    // Check form validation after input
                    checkFormValidation();
                });
            }
        });

        // Email validation
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                checkFormValidation();
            });
            emailInput.addEventListener('blur', function() {
                if (this.value && !isValidEmail(this.value)) {
                    showStatus('Format d\'email invalide.', 'error');
                }
            });
        }

        // Message content validation
        const messageInput = document.getElementById('Commentaires');
        if (messageInput) {
            messageInput.addEventListener('input', function() {
                // Remove script tags and other dangerous content
                this.value = this.value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                this.value = this.value.replace(/javascript:/gi, '');
                checkFormValidation();
            });
        }
    }

    function addFormValidation() {
        // Check form validation on page load
        checkFormValidation();
    }

    function checkFormValidation() {
        const submitBtn = document.getElementById('submit-btn');
        if (!submitBtn) {
            return;
        }

        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' || 
                             window.location.hostname === '[::]' ||
                             window.location.hostname.includes('local') ||
                             window.location.hostname === '';

        // Check if form is valid
        const formValid = isFormValid();
        
        // Check reCAPTCHA (only for production)
        let recaptchaValid = true;
        
        if (!isDevelopment && typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
            const recaptchaResponse = grecaptcha.getResponse();
            recaptchaValid = recaptchaResponse.length > 0;
        }

        // Enable button if both form and reCAPTCHA are valid
        if (formValid && recaptchaValid) {
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = '#FF4B1F';
            submitBtn.style.cursor = 'pointer';
            
            // Clear any previous status messages
            const statusDiv = document.getElementById('form-status');
            if (statusDiv) {
                statusDiv.style.display = 'none';
            }
        } else {
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = '#ccc';
            submitBtn.style.cursor = 'not-allowed';
            
            // Show helpful message to user
            const statusDiv = document.getElementById('form-status');
            if (statusDiv) {
                if (formValid && !recaptchaValid && !isDevelopment) {
                    statusDiv.textContent = '✅ Formulaire valide ! Veuillez cocher la case reCAPTCHA ci-dessus pour continuer.';
                    statusDiv.style.display = 'block';
                    statusDiv.style.backgroundColor = '#fff3cd';
                    statusDiv.style.color = '#856404';
                    statusDiv.style.border = '1px solid #ffeaa7';
                } else if (formValid && !recaptchaValid && isDevelopment) {
                    statusDiv.textContent = '✅ Formulaire valide ! En mode développement, le reCAPTCHA est désactivé.';
                    statusDiv.style.display = 'block';
                    statusDiv.style.backgroundColor = '#d4edda';
                    statusDiv.style.color = '#155724';
                    statusDiv.style.border = '1px solid #c3e6cb';
                } else if (!formValid) {
                    statusDiv.textContent = 'Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email).';
                    statusDiv.style.display = 'block';
                    statusDiv.style.backgroundColor = '#f8d7da';
                    statusDiv.style.color = '#721c24';
                    statusDiv.style.border = '1px solid #f5c6cb';
                }
            }
        }
    }

    function isFormValid() {
        const nom = document.getElementById('Nom');
        const prenom = document.getElementById('Pr-nom');
        const email = document.getElementById('email');

        // Check if required fields are filled
        const nomValid = nom && nom.value.trim().length > 0;
        const prenomValid = prenom && prenom.value.trim().length > 0;
        const emailValid = email && email.value.trim().length > 0 && isValidEmail(email.value);

        return nomValid && prenomValid && emailValid;
    }

    // Make checkFormValidation available globally for reCAPTCHA callback
    window.checkFormValidation = checkFormValidation;

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    function generateSecureToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 16; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token + Date.now().toString(36);
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';
        
        switch(type) {
            case 'success':
                statusDiv.style.backgroundColor = '#d4edda';
                statusDiv.style.color = '#155724';
                statusDiv.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                statusDiv.style.backgroundColor = '#f8d7da';
                statusDiv.style.color = '#721c24';
                statusDiv.style.border = '1px solid #f5c6cb';
                break;
            case 'info':
                statusDiv.style.backgroundColor = '#d1ecf1';
                statusDiv.style.color = '#0c5460';
                statusDiv.style.border = '1px solid #bee5eb';
                break;
        }
        
        // Hide status after 5 seconds
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Add touch detection class to html element
(function(o, c) {
    var n = c.documentElement,
        t = " w-mod-";
    n.className += t + "js";
    ("ontouchstart" in o || (o.DocumentTouch && c instanceof DocumentTouch)) &&
        (n.className += t + "touch");
})(window, document); 