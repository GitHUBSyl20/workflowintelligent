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
    console.log('[FORM DEBUG] ⚡ initContactForm() called!');
    const form = document.getElementById('email-form');
    const submitBtn = document.getElementById('submit-btn');
    const statusDiv = document.getElementById('form-status');
    const formToken = document.getElementById('form-token');
    console.log('[FORM DEBUG] Form element found:', !!form, 'Form ID:', form ? form.id : 'NOT FOUND');
    
    // Security variables
    let submissionCount = 0;
    let lastSubmissionTime = 0;
    const MAX_SUBMISSIONS = 3;
    const TIME_WINDOW = 60000; // 1 minute
    const MIN_TIME_BETWEEN_SUBMISSIONS = 3000; // 3 seconds

    // Store initial input IDs/names for comparison later (accessible to all blocks)
    let initialInputIds = [];

    // #region agent log - HYPOTHESIS A: Check all inputs at initialization
    if (form) {
        console.log('[FORM DEBUG] Form found, analyzing inputs...', { formId: form.id });
        fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'custom.js:105',message:'Form found, analyzing inputs',data:{formId:form.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        const allInputs = form.querySelectorAll('input, textarea, select');
        console.log('[FORM DEBUG] Total inputs found:', allInputs.length);
        // Store initial input IDs/names for comparison later
        initialInputIds = Array.from(allInputs).map(input => (input.id || input.name || input.type || 'unknown') + '|' + (input.tagName || ''));
        console.log('[FORM DEBUG] Initial input IDs stored:', initialInputIds.length, initialInputIds);
        fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'custom.js:107',message:'Total inputs found',data:{count:allInputs.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        allInputs.forEach((input, index) => {
            const rect = input.getBoundingClientRect();
            const styles = window.getComputedStyle(input);
            const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0' && rect.width > 0 && rect.height > 0;
            const inputInfo = { id: input.id, name: input.name, type: input.type, tagName: input.tagName, isVisible: isVisible, display: styles.display, opacity: styles.opacity, position: styles.position, width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom, hasHoneypotName: input.name === '_gotcha' || input.name === 'website', outerHTML: input.outerHTML.substring(0, 150) };
            if (isVisible || input.name === '_gotcha' || input.name === 'website' || input.id === 'website') {
                console.log(`[FORM DEBUG] Input #${index + 1}:`, inputInfo);
            }
            fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'custom.js:110',message:`Input #${index+1} details`,data:inputInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        });
        const recaptcha = form.querySelector('.g-recaptcha');
        const submit = form.querySelector('input[type="submit"]');
        if (recaptcha && submit) {
            console.log('[FORM DEBUG] Checking elements between reCAPTCHA and submit...');
            fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'custom.js:142',message:'Checking elements between reCAPTCHA and submit',data:{recaptchaFound:!!recaptcha,submitFound:!!submit},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            let element = recaptcha.nextElementSibling;
            let betweenCount = 0;
            while (element && element !== submit) {
                betweenCount++;
                const rect = element.getBoundingClientRect();
                const styles = window.getComputedStyle(element);
                const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0' && rect.width > 0 && rect.height > 0;
                const elemInfo = { 
                    tagName: element.tagName, 
                    id: element.id, 
                    className: element.className, 
                    hasInput: element.tagName === 'INPUT', 
                    inputType: element.tagName === 'INPUT' ? element.type : null,
                    isVisible: isVisible,
                    display: styles.display,
                    opacity: styles.opacity,
                    visibility: styles.visibility,
                    width: rect.width,
                    height: rect.height,
                    top: rect.top,
                    bottom: rect.bottom,
                    outerHTML: element.outerHTML ? element.outerHTML.substring(0, 300) : 'empty' 
                };
                console.log(`[FORM DEBUG] Element #${betweenCount} between reCAPTCHA and submit:`, elemInfo);
                if (isVisible && element.tagName === 'INPUT') {
                    console.error(`[FORM DEBUG] ⚠️ VISIBLE INPUT FOUND between reCAPTCHA and submit!`, elemInfo);
                }
                fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'custom.js:145',message:`Element #${betweenCount} between reCAPTCHA and submit`,data:elemInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                element = element.nextElementSibling;
            }
        }
    }
    // #endregion

    // #region agent log - HYPOTHESIS C: Monitor for dynamically added inputs after init
    if (form) {
        setTimeout(() => {
            const delayedInputs = form.querySelectorAll('input, textarea, select');
            console.log('[FORM DEBUG] Checking inputs after 2s delay (Formspree may inject). Count:', delayedInputs.length);
            fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'custom.js:130',message:'Checking inputs after 2s delay (Formspree may inject)',data:{inputCount:delayedInputs.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // Find the NEW input that wasn't there initially
            console.log('[FORM DEBUG] Comparing: initialInputIds length =', initialInputIds ? initialInputIds.length : 'UNDEFINED');
            const delayedInputIds = Array.from(delayedInputs).map(input => (input.id || input.name || input.type || 'unknown') + '|' + (input.tagName || ''));
            console.log('[FORM DEBUG] Delayed input IDs:', delayedInputIds.length, delayedInputIds);
            const newInputs = Array.from(delayedInputs).filter(input => {
                const inputId = (input.id || input.name || input.type || 'unknown') + '|' + (input.tagName || '');
                const isNew = !initialInputIds || !initialInputIds.includes(inputId);
                if (isNew) console.log('[FORM DEBUG] Found new input:', inputId);
                return isNew;
            });
            
            if (newInputs.length > 0) {
                console.error('[FORM DEBUG] ⚠️ NEW INPUT(S) DETECTED AFTER DELAY:', newInputs.length);
                newInputs.forEach((input, index) => {
                    const rect = input.getBoundingClientRect();
                    const styles = window.getComputedStyle(input);
                    const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0' && rect.width > 0 && rect.height > 0;
                    const newInputInfo = {
                        id: input.id,
                        name: input.name,
                        type: input.type,
                        tagName: input.tagName,
                        isVisible: isVisible,
                        display: styles.display,
                        opacity: styles.opacity,
                        visibility: styles.visibility,
                        position: styles.position,
                        width: rect.width,
                        height: rect.height,
                        top: rect.top,
                        bottom: rect.bottom,
                        outerHTML: input.outerHTML.substring(0, 300),
                        parentHTML: input.parentElement ? input.parentElement.outerHTML.substring(0, 200) : 'no parent',
                        className: input.className,
                        style: input.getAttribute('style')
                    };
                    console.error(`[FORM DEBUG] ⚠️ NEW INPUT #${index + 1}:`, newInputInfo);
                });
            } else {
                console.log('[FORM DEBUG] No new inputs detected after delay');
            }
            
            // Also list ALL visible inputs for visibility check
            console.log('[FORM DEBUG] Listing ALL VISIBLE inputs after 2s delay:');
            delayedInputs.forEach((input, index) => {
                const rect = input.getBoundingClientRect();
                const styles = window.getComputedStyle(input);
                const isVisible = styles.display !== 'none' && styles.visibility !== 'hidden' && styles.opacity !== '0' && rect.width > 0 && rect.height > 0;
                if (isVisible) {
                    const inputInfo = { id: input.id, name: input.name, type: input.type, tagName: input.tagName, display: styles.display, opacity: styles.opacity, position: styles.position, width: rect.width, height: rect.height };
                    console.log(`[FORM DEBUG] VISIBLE Input #${index + 1}:`, inputInfo);
                }
            });
        }, 2000);
        
        // Monitor DOM mutations for dynamically added inputs
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA' || node.tagName === 'SELECT')) {
                            const dynInfo = { tagName: node.tagName, id: node.id, name: node.name, type: node.type, outerHTML: node.outerHTML.substring(0, 200) };
                            console.log('[FORM DEBUG] ⚠️ Dynamic input added to DOM!', dynInfo);
                            fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'custom.js:140',message:'Dynamic input added to DOM!',data:dynInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        }
                    });
                });
            });
            observer.observe(form, { childList: true, subtree: true });
            console.log('[FORM DEBUG] MutationObserver started to watch for dynamic inputs');
            fetch('http://127.0.0.1:7245/ingest/a8b6cf51-41c9-4dd9-85b5-5267a6ed7967',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'custom.js:146',message:'MutationObserver started to watch for dynamic inputs',data:{formId:form.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        }
    }
    // #endregion

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

            // Default Formspree submission for all cases
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
        
        // Honeypot field removed - protection handled by reCAPTCHA and rate limiting

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