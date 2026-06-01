/**
 * PRESTIGE VTC STRASBOURG - MAIN SCRIPT
 * Handles interactivity, modal workflow, Turnstile verification, FAQ accordion,
 * scroll indicators, dynamic date rules, and responsive navigation.
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Sticky Header / Scroll Behavior ---
    const header = document.querySelector('.header');
    
    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Init on page load

    // --- 2. Mobile Menu Toggle ---
    const menuToggle = document.querySelector('.menu-toggle');
    const mobileNav = document.querySelector('.mobile-nav');
    const mobileNavClose = document.querySelector('.mobile-nav-close');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    if (menuToggle && mobileNav) {
        menuToggle.addEventListener('click', () => {
            mobileNav.classList.add('open');
            document.body.style.overflow = 'hidden'; // Stop body scrolling
        });
    }

    const closeMobileMenu = () => {
        if (mobileNav) {
            mobileNav.classList.remove('open');
            document.body.style.overflow = '';
        }
    };

    if (mobileNavClose) {
        mobileNavClose.addEventListener('click', closeMobileMenu);
    }

    mobileLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // --- 3. Booking Tab Switcher (Aller Simple vs. Mise à disposition) ---
    const tabButtons = document.querySelectorAll('.booking-tab');
    const destinationInput = document.getElementById('lieu-destination');
    const destinationGroup = document.getElementById('group-destination');
    const durationInput = document.getElementById('duration-select');
    const durationGroup = document.getElementById('group-duration');
    const bookingTypeInput = document.getElementById('booking-type');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const tabType = button.getAttribute('data-type');
            if (bookingTypeInput) {
                bookingTypeInput.value = tabType;
            }

            if (tabType === 'aller-simple') {
                // Show Destination, Hide Duration
                if (destinationGroup) destinationGroup.style.display = 'flex';
                if (destinationInput) destinationInput.setAttribute('required', 'required');
                
                if (durationGroup) durationGroup.style.display = 'none';
                if (durationInput) durationInput.removeAttribute('required');
            } else {
                // Hide Destination, Show Duration
                if (destinationGroup) destinationGroup.style.display = 'none';
                if (destinationInput) destinationInput.removeAttribute('required');
                
                if (durationGroup) durationGroup.style.display = 'flex';
                if (durationInput) durationInput.setAttribute('required', 'required');
            }
        });
    });

    // --- 4. Minimum Date Limitation (No past dates) ---
    const dateInput = document.getElementById('booking-date');
    if (dateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const minDateString = `${year}-${month}-${day}`;
        dateInput.setAttribute('min', minDateString);
        dateInput.value = minDateString; // Pre-fill with today
    }

    // Pre-fill time input with current time + 1 hour (rounded to next 5 min)
    const timeInput = document.getElementById('booking-time');
    if (timeInput) {
        const d = new Date();
        d.setHours(d.getHours() + 1);
        const minutes = Math.ceil(d.getMinutes() / 5) * 5;
        if (minutes >= 60) {
            d.setHours(d.getHours() + 1);
            d.setMinutes(0);
        } else {
            d.setMinutes(minutes);
        }
        const hoursString = String(d.getHours()).padStart(2, '0');
        const minsString = String(d.getMinutes()).padStart(2, '0');
        timeInput.value = `${hoursString}:${minsString}`;
    }

    // --- 5. Booking Modal Logic (Workflow integration) ---
    const quickBookingForm = document.getElementById('quick-booking-form');
    const modalOverlay = document.getElementById('booking-modal');
    const modalCloseBtn = document.getElementById('modal-close');
    
    // Modal pre-filled elements
    const modalBookingType = document.getElementById('modal-summary-type');
    const modalBookingRoute = document.getElementById('modal-summary-route');
    const modalBookingSchedule = document.getElementById('modal-summary-schedule');
    const modalBookingPax = document.getElementById('modal-summary-pax');

    // Internal values from Quick Form to carry over to submission
    const finalBookingType = document.getElementById('final-type');
    const finalStart = document.getElementById('final-start');
    const finalEnd = document.getElementById('final-end');
    const finalDuration = document.getElementById('final-duration');
    const finalDate = document.getElementById('final-date');
    const finalTime = document.getElementById('final-time');
    const finalPassengers = document.getElementById('final-passengers');

    const openModal = () => {
        if (modalOverlay) {
            modalOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        }
    };

    const closeModal = () => {
        if (modalOverlay) {
            modalOverlay.classList.remove('open');
            document.body.style.overflow = '';
            
            // Reset feedback container if user re-opens
            const formContainer = document.getElementById('modal-form-container');
            const feedbackContainer = document.getElementById('modal-feedback-container');
            if (formContainer && feedbackContainer) {
                formContainer.style.display = 'block';
                feedbackContainer.style.display = 'none';
                feedbackContainer.classList.remove('active');
            }
        }
    };

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Intercept Quick Form to open Details Modal
    if (quickBookingForm) {
        quickBookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Extract inputs from Quick Form
            const type = bookingTypeInput ? bookingTypeInput.value : 'aller-simple';
            const start = document.getElementById('lieu-depart').value;
            const end = destinationInput ? destinationInput.value : '';
            const duration = durationInput ? durationInput.value : '';
            const dateVal = dateInput.value;
            const timeVal = timeInput.value;
            const pax = document.getElementById('passengers-select').value;

            // Format date for display in French style (DD/MM/YYYY)
            const dateParts = dateVal.split('-');
            const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateVal;

            // Carry values to hidden inputs in the modal form
            if (finalBookingType) finalBookingType.value = type === 'aller-simple' ? 'Aller Simple' : 'Mise à Disposition';
            if (finalStart) finalStart.value = start;
            if (finalEnd) finalEnd.value = end;
            if (finalDuration) finalDuration.value = duration;
            if (finalDate) finalDate.value = dateVal;
            if (finalTime) finalTime.value = timeVal;
            if (finalPassengers) finalPassengers.value = pax;

            // Populate visual summary in modal header
            if (modalBookingType) {
                modalBookingType.textContent = type === 'aller-simple' ? 'Course Aller Simple' : 'Mise à Disposition';
            }
            if (modalBookingRoute) {
                modalBookingRoute.textContent = type === 'aller-simple' 
                    ? `De: ${start} → À: ${end}` 
                    : `Départ: ${start} (Durée: ${duration})`;
            }
            if (modalBookingSchedule) {
                modalBookingSchedule.textContent = `Le ${displayDate} à ${timeVal}`;
            }
            if (modalBookingPax) {
                modalBookingPax.textContent = `${pax} Passager${pax > 1 ? 's' : ''}`;
            }

            // Open Modal
            openModal();
        });
    }

    // Direct booking button hooks (e.g. from service cards or prices list)
    window.initiateDirectBooking = (type, details = {}) => {
        // Pre-fills quick booking form based on card details and triggers modal
        const startInput = document.getElementById('lieu-depart');
        
        if (startInput) {
            if (type === 'airport') {
                // Set Tab to Aller Simple
                document.querySelector('.booking-tab[data-type="aller-simple"]').click();
                startInput.value = details.depart || 'Strasbourg Centre';
                if (destinationInput) destinationInput.value = details.destination || 'Aéroport de Strasbourg-Entzheim (SXB)';
            } else if (type === 'hourly') {
                // Set Tab to Mise à Disposition
                document.querySelector('.booking-tab[data-type="mise-disposition"]').click();
                startInput.value = 'Strasbourg';
                if (durationInput) durationInput.value = details.duree || '4';
            } else if (type === 'generic-aller') {
                document.querySelector('.booking-tab[data-type="aller-simple"]').click();
                startInput.value = details.depart || '';
                if (destinationInput) destinationInput.value = details.destination || '';
            }
        }
        
        // Scroll smoothly to quick form and focus start input
        document.getElementById('accueil').scrollIntoView({ behavior: 'smooth' });
        setTimeout(() => {
            startInput.focus();
        }, 800);
    };

    // --- 6. Form Submission (Cloudflare Integration) ---
    const modalForm = document.getElementById('modal-details-form');
    const formContainer = document.getElementById('modal-form-container');
    const feedbackContainer = document.getElementById('modal-feedback-container');

    if (modalForm) {
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Transition UI to loader
            if (formContainer && feedbackContainer) {
                formContainer.style.display = 'none';
                feedbackContainer.style.display = 'flex';
                feedbackContainer.classList.add('active');
                feedbackContainer.innerHTML = `
                    <div class="spinner"></div>
                    <p class="feedback-title">Traitement en cours</p>
                    <p class="feedback-text">Nous validons votre réservation et préparons l'envoi du récapitulatif...</p>
                `;
            }

            // Gather all form fields
            const formData = new FormData(modalForm);
            
            // Build a standard object
            const dataObj = {};
            formData.forEach((value, key) => {
                dataObj[key] = value;
            });

            // Retrieve Turnstile Captcha response
            const turnstileResponse = dataObj['cf-turnstile-response'] || '';

            // Make POST request to worker endpoint
            // We use absolute path/relative endpoint depending on hosting. In Cloudflare, a /api/book endpoint is common.
            // If the worker is running on worker subdomain, we can adjust.
            fetch('/api/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dataObj)
            })
            .then(async (response) => {
                if (response.ok) {
                    showFormSuccess();
                    // Reset forms
                    modalForm.reset();
                    if (quickBookingForm) quickBookingForm.reset();
                    // Reset turnstile widget if it exists
                    if (typeof turnstile !== 'undefined') {
                        turnstile.reset();
                    }
                } else {
                    const errData = await response.json().catch(() => ({}));
                    showFormError(errData.message || 'Une erreur est survenue lors de l\'envoi.');
                }
            })
            .catch((error) => {
                console.error('Reservation error:', error);
                // For demonstration / local execution without server: mock success to show premium state
                // Only mock if we are running locally under file:// or localhost without endpoints
                if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log('Running locally. Mocking booking success.');
                    setTimeout(() => {
                        showFormSuccess();
                    }, 1500);
                } else {
                    showFormError('Impossible de contacter le serveur de réservation. Veuillez réessayer ou nous appeler directement.');
                }
            });
        });
    }

    const showFormSuccess = () => {
        if (feedbackContainer) {
            feedbackContainer.innerHTML = `
                <div class="feedback-icon-success">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <h3 class="feedback-title">Réservation Reçue !</h3>
                <p class="feedback-text">Merci pour votre demande. Un e-mail récapitulatif a été envoyé à l'adresse indiquée. Votre chauffeur confirmera votre trajet par SMS/E-mail sous quelques minutes.</p>
                <button class="btn btn-primary" onclick="document.getElementById('booking-modal').classList.remove('open'); document.body.style.overflow = '';" style="margin-top: 1rem; width: auto; font-size: 0.75rem;">Fermer</button>
            `;
        }
    };

    const showFormError = (message) => {
        if (feedbackContainer) {
            feedbackContainer.innerHTML = `
                <div class="feedback-icon-success" style="background-color: rgba(239, 68, 68, 0.1); border-color: rgb(239, 68, 68); color: rgb(239, 68, 68);">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                </div>
                <h3 class="feedback-title" style="color: rgb(239, 68, 68);">Échec de l'envoi</h3>
                <p class="feedback-text">${message}</p>
                <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                    <button class="btn btn-outline" onclick="const formContainer = document.getElementById('modal-form-container'); const feedbackContainer = document.getElementById('modal-feedback-container'); formContainer.style.display = 'block'; feedbackContainer.style.display = 'none'; feedbackContainer.classList.remove('active');" style="font-size: 0.75rem;">Réessayer</button>
                    <a href="tel:0771830710" class="btn btn-primary" style="font-size: 0.75rem;">Appeler</a>
                </div>
            `;
        }
    };

    // --- 7. FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const trigger = item.querySelector('.faq-trigger');
        const content = item.querySelector('.faq-content');
        
        if (trigger && content) {
            trigger.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all FAQ items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    const otherContent = otherItem.querySelector('.faq-content');
                    if (otherContent) {
                        otherContent.style.maxHeight = '0px';
                    }
                });
                
                // Toggle clicked FAQ item
                if (!isActive) {
                    item.classList.add('active');
                    // Compute content height
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        }
    });

    // --- 8. Scroll Reveal Animation ---
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 150; // trigger pixel before bottom of viewport
        
        revealElements.forEach(element => {
            const revealTop = element.getBoundingClientRect().top;
            
            if (revealTop < windowHeight - revealPoint) {
                element.classList.add('active');
            }
        });
    };
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Trigger once on load
});
