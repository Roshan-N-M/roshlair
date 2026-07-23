document.addEventListener('DOMContentLoaded', () => {
    // --- STICKY NAV ---
    const header = document.querySelector('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- MOBILE MENU TOGGLE ---
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('nav ul');
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        });
    }

    // --- EMBER/FLAME PARTICLE GENERATION ---
    function createEmbers(element, count, clientX, clientY) {
        const rect = element.getBoundingClientRect();
        // Calculate relative coordinates inside the element if clientX is provided, otherwise center it
        const baseX = clientX !== undefined ? (clientX - rect.left) : (rect.width / 2);
        const baseY = clientY !== undefined ? (clientY - rect.top) : (rect.height / 2);

        for (let i = 0; i < count; i++) {
            const ember = document.createElement('div');
            ember.classList.add('ember');

            // Random size between 4px and 12px
            const size = Math.random() * 8 + 4;
            ember.style.width = `${size}px`;
            ember.style.height = `${size}px`;

            // Position at click/hover center
            ember.style.left = `${baseX}px`;
            ember.style.top = `${baseY}px`;

            // Randomize trajectory (translation distances)
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 80 + 30;
            const destX = Math.cos(angle) * distance;
            const destY = Math.sin(angle) * distance - (Math.random() * 50 + 20); // float upwards

            ember.style.setProperty('--x', `${destX}px`);
            ember.style.setProperty('--y', `${destY}px`);

            // Random color variations (fiery reds, oranges, yellows)
            const colors = ['#ff3b3b', '#ff9d00', '#ffd700', '#ff5722'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            ember.style.background = `radial-gradient(circle, #fff 0%, ${randomColor} 60%, transparent 100%)`;

            // Randomize duration
            const duration = Math.random() * 0.5 + 0.4;
            ember.style.animationDuration = `${duration}s`;

            element.appendChild(ember);

            // Clean up DOM after animation ends
            setTimeout(() => {
                ember.remove();
            }, duration * 1000);
        }
    }

    // --- INTERACTIVE GUITAR FRETBOARD ---
    const frets = document.querySelectorAll('.fret');
    const strings = document.querySelectorAll('.string');

    // Track mouse button state to support strum dragging
    let isMouseDown = false;
    document.addEventListener('mousedown', () => { isMouseDown = true; });
    document.addEventListener('mouseup', () => { isMouseDown = false; });

    // Handle strum/play trigger
    function triggerGuitarString(fretElement, event) {
        const stringElement = fretElement.closest('.string');
        const stringIndex = parseInt(stringElement.getAttribute('data-string'), 10);
        const fretIndex = parseInt(fretElement.getAttribute('data-fret'), 10);

        // 1. Play Audio tone using our Synth (sound.js)
        if (window.guitar) {
            window.guitar.playGuitarNote(stringIndex, fretIndex);
        }

        // 2. Trigger string vibration animation
        stringElement.classList.remove('vibrating');
        void stringElement.offsetWidth; // Trigger reflow to restart animation
        stringElement.classList.add('vibrating');
        setTimeout(() => {
            stringElement.classList.remove('vibrating');
        }, 300);

        // 3. Generate fire embers at the point of action
        createEmbers(fretElement, 12, event.clientX, event.clientY);
    }

    // Add mouse & touch bindings to all frets
    frets.forEach(fret => {
        fret.addEventListener('mousedown', (e) => {
            e.preventDefault();
            triggerGuitarString(fret, e);
        });

        fret.addEventListener('mouseenter', (e) => {
            // Strumming effect: if user holds down mouse and drags across frets
            if (isMouseDown) {
                triggerGuitarString(fret, e);
            }
        });

        // Touch support for mobile devices
        fret.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            triggerGuitarString(fret, touch);
        }, { passive: false });
    });

    // --- PORTFOLIO DYNAMIC STOMPBOX FILTERS ---
    const pedalBtns = document.querySelectorAll('.pedal-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    pedalBtns.forEach(pedal => {
        pedal.addEventListener('click', () => {
            // Visual switch click sound (clean crisp guitar pick click)
            if (window.guitar) {
                window.guitar.playNote(440, 0.1, 0.15); // subtle click audio feedback
            }

            // Toggle active pedalboard button state
            pedalBtns.forEach(btn => btn.classList.remove('active'));
            pedal.classList.add('active');

            const categoryFilter = pedal.getAttribute('data-filter');

            portfolioCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (categoryFilter === 'all' || cardCategory === categoryFilter) {
                    card.classList.remove('fade-out');
                    // Add cool entry animation
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.9) translateY(15px)';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1) translateY(0)';
                    }, 50);
                } else {
                    card.classList.add('fade-out');
                }
            });
        });
    });

    // --- DYNAMIC WORKS METADATA & DETAILS MODAL ---
    const modal = document.getElementById('project-modal');
    const modalClose = document.querySelector('.modal-close-btn');
    const viewProjectBtns = document.querySelectorAll('.overlay-btn');

    // Projects data store mapping card IDs to rich info
    const projectsData = {
        'dragon-synth': {
            title: "Dragon Synth Engine",
            category: "Web App Development",
            image: "dragon_guitar_art.png",
            description: "A Web Audio Synthesizer built with HTML5 Canvas and complex Web Audio routing. Simulates tube amplifiers, wave folder distortions, and includes visual fire spectral analyzers that sync directly to the user's keystrokes. Users can save custom presets and export their tracks as high-quality WAV files directly in the browser.",
            client: "Metalhead Records",
            date: "November 2025",
            tech: "Web Audio API, JavaScript (ES6+), Canvas API, Vanilla CSS",
            link: "#"
        },
        'fretboard-trainer': {
            title: "Fretboard Master Trainer",
            category: "Music & Gaming",
            image: "guitar_amp_visual.png",
            description: "An educational web game designed to help aspiring guitar players memorize scales and note charts on the fretboard. The application listens to user guitar inputs via real-time microphone pitch detection (using Autocorrelation Algorithms) and matches them against flashcards in real-time.",
            client: "Acoustic Hub",
            date: "August 2025",
            tech: "Web Audio API, Pitch Detection, SVG, LocalStorage",
            link: "#"
        },
        'roshh-music': {
            title: "Roshh Heavy Beats EP",
            category: "Music & Production",
            image: "about_guitar_visual.png",
            description: "Production and mixing for the Roshh debut single project. Involves complex layering of acoustic drums with heavy metal sub-octave guitar chugs and orchestral arrangements. Engineered utilizing custom high-fidelity digital signal processing (DSP) chains.",
            client: "Indie Release",
            date: "June 2025",
            tech: "Cubase Pro, Neural DSP, FabFilter, Sound Engineering",
            link: "#"
        },
        'dragon-visuals': {
            title: "Lair of the Dragon: UI Kit",
            category: "UI/UX Design",
            image: "dragon_guitar_art.png",
            description: "A premium design package styled around mythological fantasy interfaces. Incorporates golden borders, volcanic textured frames, dark ruby glass overlays, and organic flame particle loops. Delivered with comprehensive Figma libraries, typography stylesheets, and interactive prototypes.",
            client: "Epic Guild Games",
            date: "April 2025",
            tech: "Figma, Illustrator, Adobe After Effects, Design Systems",
            link: "#"
        }
    };

    function openModal(projectId) {
        const data = projectsData[projectId];
        if (!data) return;

        // Populate details
        document.getElementById('modal-img').src = data.image;
        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-category').textContent = data.category;
        document.getElementById('modal-desc').textContent = data.description;
        document.getElementById('modal-client').textContent = data.client;
        document.getElementById('modal-date').textContent = data.date;
        document.getElementById('modal-tech').textContent = data.tech;
        
        const modalLink = document.getElementById('modal-link');
        if (modalLink) {
            modalLink.href = data.link;
        }

        // Open modal with smooth transition
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock background scrolling

        // Heavy drop bass sound effect when opening modal
        if (window.guitar) {
            window.guitar.playNote(110.00, 1.8, 0.4); // Deep A string chug
        }
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Unlock scrolling
    }

    viewProjectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.portfolio-card');
            const projectId = card.getAttribute('data-id');
            openModal(projectId);
        });
    });

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    // Close modal on background click
    const modalBg = document.querySelector('.modal-bg');
    if (modalBg) {
        modalBg.addEventListener('click', closeModal);
    }

    // --- CONTACT AMP INTERACTIVITY ---
    const contactForm = document.getElementById('guitar-amp-form');
    const powerLed = document.querySelector('.amp-power-led');
    const ampKnobs = document.querySelectorAll('.amp-knob');
    const formControls = document.querySelectorAll('.form-control');

    // 1. Interactive Dial Knobs (rotate on hover/click)
    ampKnobs.forEach((knob, idx) => {
        let rotation = 0;
        knob.addEventListener('click', () => {
            // Rotate dial incrementally by 45 degrees
            rotation = (rotation + 45) % 360;
            knob.style.transform = `rotate(${rotation}deg)`;
            
            // Adjust synthesiser frequency based on dial interactions for fun!
            if (window.guitar) {
                const pitch = 220 + (rotation / 360) * 440; // Frequency scale
                window.guitar.playNote(pitch, 0.4, 0.25);
            }
        });
    });

    // 2. Form state monitors standby Power LED
    function updateAmpLED() {
        let allFilled = true;
        formControls.forEach(input => {
            if (input.value.trim() === '') {
                allFilled = false;
            }
        });

        if (allFilled) {
            powerLed.classList.add('on'); // Standby lights up
        } else {
            powerLed.classList.remove('on');
        }
    }

    formControls.forEach(input => {
        input.addEventListener('input', updateAmpLED);
    });

    // 3. Fire-Breathing Form Submit
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Fire epic rock chords on submission
            if (window.guitar) {
                // Play E5 power chord in progression (E2, B2, E3)
                window.guitar.playNote(82.41, 2.5, 0.6); // E2
                setTimeout(() => window.guitar.playNote(123.47, 2.2, 0.5), 80); // B2
                setTimeout(() => window.guitar.playNote(164.81, 2.0, 0.4), 160); // E3
            }

            // Fire ember explosion on the submit button!
            const submitBtn = contactForm.querySelector('.btn-primary');
            createEmbers(submitBtn, 45);

            // Toast/Alert success display
            const submitLabel = submitBtn.querySelector('span');
            const originalText = submitLabel.textContent;
            
            submitBtn.style.pointerEvents = 'none';
            submitLabel.textContent = "SOLO FIRED! (SENT)";
            submitBtn.style.background = "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)";
            submitBtn.style.boxShadow = "0 8px 25px rgba(76, 175, 80, 0.6)";

            setTimeout(() => {
                contactForm.reset();
                updateAmpLED();
                submitLabel.textContent = originalText;
                submitBtn.style.pointerEvents = '';
                submitBtn.style.background = '';
                submitBtn.style.boxShadow = '';
            }, 4000);
        });
    }
});
