// Custom JavaScript for DigitalAIchemy website

// Debug logging function
function debugLog(message, data = null) {
    console.log(`[FORM DEBUG] ${message}`, data || '');
}

// reCAPTCHA callback function - GLOBAL VERSION
function onRecaptchaSuccess() {
    debugLog('GLOBAL reCAPTCHA completed - calling checkFormValidation');
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
    debugLog('DOM loaded - initializing components');
    // Initialize all components
    initTabs();
    initScrollEffects();
    initContactForm();
});

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
    debugLog('initContactForm called');
    
    const form = document.getElementById('email-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusDiv = document.getElementById('form-status');
    const formToken = document.getElementById('form-token');
    
    debugLog('Elements found:', {
        form: !!form,
        submitBtn: !!submitBtn,
        statusDiv: !!statusDiv,
        formToken: !!formToken
    });
    
    // Security variables
    let submissionCount = 0;
    let lastSubmissionTime = 0;
    const MAX_SUBMISSIONS = 3;
    const TIME_WINDOW = 60000; // 1 minute
    const MIN_TIME_BETWEEN_SUBMISSIONS = 3000; // 3 seconds

    if (form && formToken) {
        debugLog('Form and token found - proceeding with initialization');
        
        // Check if we're in development mode (no reCAPTCHA)
        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' || 
                             window.location.hostname === '[::]' ||
                             window.location.hostname.includes('local') ||
                             window.location.hostname === '';
        
        debugLog('Development mode detected:', isDevelopment);
        
        // Initialize submit button as disabled
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.backgroundColor = '#ccc';
            submitBtn.style.cursor = 'not-allowed';
            debugLog('Submit button initialized as disabled');
        } else {
            debugLog('ERROR: Submit button not found!');
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
                // Check if form was actually submitted
                const formData = new FormData(form);
                console.log('Form data being sent:', Object.fromEntries(formData));
                
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
        debugLog('addInputValidation called');
        
        // Real-time input sanitization
        const textInputs = ['Nom', 'Pr-nom'];
        textInputs.forEach(id => {
            const input = document.getElementById(id);
            debugLog(`Looking for input with ID: ${id}`, !!input);
            if (input) {
                input.addEventListener('input', function() {
                    debugLog(`=== INPUT EVENT FIRED for ${id} ===`);
                    debugLog(`Value before sanitization: "${this.value}"`);
                    // Remove potentially dangerous characters
                    this.value = this.value.replace(/[<>{}[\]\\\/]/g, '');
                    debugLog(`Value after sanitization: "${this.value}"`);
                    // Check form validation after input
                    debugLog(`Calling checkFormValidation from ${id} input event`);
                    checkFormValidation();
                });
                debugLog(`Event listener added for ${id}`);
            }
        });

        // Email validation
        const emailInput = document.getElementById('email');
        debugLog('Looking for email input:', !!emailInput);
        if (emailInput) {
            emailInput.addEventListener('input', function() {
                debugLog(`=== EMAIL INPUT EVENT FIRED ===`);
                debugLog(`Email value: "${this.value}"`);
                debugLog('Calling checkFormValidation from email input event');
                checkFormValidation();
            });
            emailInput.addEventListener('blur', function() {
                if (this.value && !isValidEmail(this.value)) {
                    showStatus('Format d\'email invalide.', 'error');
                }
            });
            debugLog('Email event listeners added');
        }

        // Message content validation
        const messageInput = document.getElementById('Commentaires');
        debugLog('Looking for message input:', !!messageInput);
        if (messageInput) {
            messageInput.addEventListener('input', function() {
                debugLog('Message input event fired:', this.value);
                // Remove script tags and other dangerous content
                this.value = this.value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                this.value = this.value.replace(/javascript:/gi, '');
                checkFormValidation();
            });
            debugLog('Message event listener added');
        }
    }

    function addFormValidation() {
        debugLog('addFormValidation called');
        
        // Check form validation on page load
        checkFormValidation();
        
        // Add event listeners for reCAPTCHA callback
        if (typeof grecaptcha !== 'undefined') {
            debugLog('reCAPTCHA is available');
            // Don't override the global callback - let it use the global onRecaptchaSuccess
            debugLog('Using global onRecaptchaSuccess callback');
        } else {
            debugLog('reCAPTCHA is not available');
        }
    }

    function checkFormValidation() {
        debugLog('checkFormValidation called');
        
        const submitBtn = document.getElementById('submit-btn');
        if (!submitBtn) {
            debugLog('ERROR: Submit button not found in checkFormValidation!');
            return;
        }

        const isDevelopment = window.location.hostname === 'localhost' || 
                             window.location.hostname === '127.0.0.1' || 
                             window.location.hostname === '[::]' ||
                             window.location.hostname.includes('local') ||
                             window.location.hostname === '';

        debugLog('Current hostname:', window.location.hostname);
        debugLog('Development mode detected:', isDevelopment);

        // Check if form is valid
        const formValid = isFormValid();
        debugLog('Form validation result:', formValid);
        
        // Check reCAPTCHA (only for production)
        let recaptchaValid = true;
        let recaptchaResponse = '';
        
        if (!isDevelopment && typeof grecaptcha !== 'undefined' && grecaptcha.getResponse) {
            recaptchaResponse = grecaptcha.getResponse();
            recaptchaValid = recaptchaResponse.length > 0;
            debugLog('reCAPTCHA response length:', recaptchaResponse.length);
            debugLog('reCAPTCHA validation result:', recaptchaValid);
            
            // Additional debugging for reCAPTCHA state
            if (typeof grecaptcha.getResponse === 'function') {
                debugLog('grecaptcha.getResponse is available');
            } else {
                debugLog('grecaptcha.getResponse is NOT available');
            }
            
            // Check if reCAPTCHA widget is rendered
            const recaptchaWidget = document.querySelector('.g-recaptcha');
            if (recaptchaWidget) {
                debugLog('reCAPTCHA widget found in DOM');
                const iframe = recaptchaWidget.querySelector('iframe');
                if (iframe) {
                    debugLog('reCAPTCHA iframe found');
                } else {
                    debugLog('reCAPTCHA iframe NOT found - widget may not be loaded');
                }
            } else {
                debugLog('reCAPTCHA widget NOT found in DOM');
            }
        } else {
            debugLog('reCAPTCHA validation skipped (development mode or not available)');
            if (isDevelopment) {
                debugLog('Reason: Development mode detected');
            } else if (typeof grecaptcha === 'undefined') {
                debugLog('Reason: grecaptcha is undefined');
            } else if (!grecaptcha.getResponse) {
                debugLog('Reason: grecaptcha.getResponse is not available');
            }
        }

        // Enable button if both form and reCAPTCHA are valid
        if (formValid && recaptchaValid) {
            debugLog('Enabling button - both form and reCAPTCHA are valid');
            submitBtn.disabled = false;
            submitBtn.style.backgroundColor = '#FF4B1F';
            submitBtn.style.cursor = 'pointer';
            
            // Clear any previous status messages
            const statusDiv = document.getElementById('form-status');
            if (statusDiv) {
                statusDiv.style.display = 'none';
            }
        } else {
            debugLog('Keeping button disabled - form or reCAPTCHA not valid');
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

        debugLog('Checking form validity for elements:', {
            nom: !!nom,
            prenom: !!prenom,
            email: !!email
        });

        // Check if required fields are filled
        const nomValid = nom && nom.value.trim().length > 0;
        const prenomValid = prenom && prenom.value.trim().length > 0;
        const emailValid = email && email.value.trim().length > 0 && isValidEmail(email.value);

        debugLog('Field validation results:', {
            nom: nomValid,
            prenom: prenomValid,
            email: emailValid,
            nomValue: nom ? nom.value : 'NOT FOUND',
            prenomValue: prenom ? prenom.value : 'NOT FOUND',
            emailValue: email ? email.value : 'NOT FOUND'
        });

        const result = nomValid && prenomValid && emailValid;
        debugLog('Overall form validity:', result);
        return result;
    }

    // Make checkFormValidation available globally for reCAPTCHA callback
    window.checkFormValidation = checkFormValidation;
    debugLog('checkFormValidation made available globally');

    // Manual test function for debugging
    window.testFormValidation = function() {
        debugLog('=== MANUAL TEST TRIGGERED ===');
        const nom = document.getElementById('Nom');
        const prenom = document.getElementById('Pr-nom');
        const email = document.getElementById('email');
        
        debugLog('Current field values:', {
            nom: nom ? nom.value : 'NOT FOUND',
            prenom: prenom ? prenom.value : 'NOT FOUND',
            email: email ? email.value : 'NOT FOUND'
        });
        
        // Test reCAPTCHA state
        debugLog('=== reCAPTCHA STATE TEST ===');
        debugLog('grecaptcha available:', typeof grecaptcha !== 'undefined');
        if (typeof grecaptcha !== 'undefined') {
            debugLog('grecaptcha.getResponse available:', typeof grecaptcha.getResponse === 'function');
            if (typeof grecaptcha.getResponse === 'function') {
                const response = grecaptcha.getResponse();
                debugLog('reCAPTCHA response:', response);
                debugLog('reCAPTCHA response length:', response.length);
            }
        }
        
        // Test DOM elements
        const recaptchaWidget = document.querySelector('.g-recaptcha');
        debugLog('reCAPTCHA widget in DOM:', !!recaptchaWidget);
        if (recaptchaWidget) {
            const iframe = recaptchaWidget.querySelector('iframe');
            debugLog('reCAPTCHA iframe in DOM:', !!iframe);
        }
        
        checkFormValidation();
    };

    // Additional debug function for reCAPTCHA
    window.testRecaptcha = function() {
        debugLog('=== reCAPTCHA SPECIFIC TEST ===');
        
        if (typeof grecaptcha === 'undefined') {
            debugLog('ERROR: grecaptcha is not defined');
            return;
        }
        
        debugLog('grecaptcha object:', grecaptcha);
        debugLog('grecaptcha.getResponse type:', typeof grecaptcha.getResponse);
        
        if (typeof grecaptcha.getResponse === 'function') {
            const response = grecaptcha.getResponse();
            debugLog('Current reCAPTCHA response:', response);
            debugLog('Response length:', response.length);
            debugLog('Response is empty:', response.length === 0);
        } else {
            debugLog('ERROR: grecaptcha.getResponse is not a function');
        }
        
        // Check if we can reset
        if (typeof grecaptcha.reset === 'function') {
            debugLog('grecaptcha.reset is available');
        } else {
            debugLog('grecaptcha.reset is NOT available');
        }
    };

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const result = emailRegex.test(email);
        debugLog('Email validation:', { email, result });
        return result;
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