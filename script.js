/**
 * L-DAHS Lab Website - Enhanced JavaScript
 * Modern Academic with Editorial Influences
 * Features: Dark Mode, i18n, Number Animation, Publications Filter, Scroll Progress
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all modules
    initNavigation();
    initSmoothScroll();
    initScrollEffects();
    initScrollProgress();
    initAnimations();
    initNumberAnimation();
    initImageModal();
    initContactForm();
    initScrollToTop();
    initDarkMode();
    initLanguageToggle();
    initPublicationsFilter();
    initHeroAnimationPause();
    initCopyrightYear();
});

/**
 * Navigation Module
 */
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');

    // Toggle mobile menu
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            const isActive = hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isActive);
        });
    }

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (hamburger && navMenu && !hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });

    // Navbar scroll effect (throttled)
    const handleNavScroll = throttle(function() {
        const currentScroll = window.scrollY;
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', handleNavScroll);

    // Active nav link highlighting (throttled)
    const sections = document.querySelectorAll('section[id]');

    const highlightNavLink = throttle(function() {
        const scrollPos = window.scrollY + 100;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, 100);

    window.addEventListener('scroll', highlightNavLink);
    highlightNavLink();
}

/**
 * Scroll Progress Indicator
 */
function initScrollProgress() {
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.querySelector('.navbar').appendChild(progressBar);

    const handleProgress = throttle(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${scrollPercent}%`;
    }, 50);

    window.addEventListener('scroll', handleProgress);
}

/**
 * Smooth Scroll Module
 */
function initSmoothScroll() {
    const navLinks = document.querySelectorAll('a[href^="#"]');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetSection = document.querySelector(targetId);
            if (!targetSection) return;

            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = targetSection.offsetTop - navbarHeight;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        });
    });
}

/**
 * Scroll Effects Module
 */
function initScrollEffects() {
    // Parallax effect for hero section (throttled)
    const hero = document.querySelector('.hero');
    const heroVisual = document.querySelector('.hero-visual');

    if (hero && heroVisual) {
        const handleParallax = throttle(function() {
            const scrolled = window.scrollY;
            const rate = scrolled * 0.3;

            if (scrolled < window.innerHeight) {
                heroVisual.style.transform = `translateY(${rate}px)`;
            }
        }, 50);

        window.addEventListener('scroll', handleParallax);
    }

    // Sticky year headers in publications
    const yearHeaders = document.querySelectorAll('.year-header');
    yearHeaders.forEach(header => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        header.classList.add('sticky');
                    } else {
                        header.classList.remove('sticky');
                    }
                });
            },
            { threshold: 1, rootMargin: '-80px 0px 0px 0px' }
        );
        observer.observe(header);
    });
}

/**
 * Hero Animation Pause - stops infinite animations when hero is off-screen
 */
function initHeroAnimationPause() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    // Start with visible class since hero is at the top
    hero.classList.add('hero-visible');

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    hero.classList.add('hero-visible');
                } else {
                    hero.classList.remove('hero-visible');
                }
            });
        },
        { threshold: 0 }
    );

    observer.observe(hero);
}

/**
 * Dynamic Copyright Year
 */
function initCopyrightYear() {
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}

/**
 * Number Animation Module - Counting animation for stats
 */
function initNumberAnimation() {
    const statCards = document.querySelectorAll('.stat-card');

    const animateNumber = (element, target, suffix = '') => {
        const duration = 2000;
        const startTime = performance.now();
        const startValue = 0;

        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (ease-out-cubic)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startValue + (target - startValue) * easeOut);

            element.textContent = current + suffix;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const valueEl = entry.target.querySelector('.stat-value');
                if (valueEl && !valueEl.dataset.animated) {
                    const text = valueEl.textContent;
                    const match = text.match(/(\d+)(\+?)/);
                    if (match) {
                        const number = parseInt(match[1]);
                        const suffix = match[2] || '';
                        valueEl.dataset.animated = 'true';
                        animateNumber(valueEl, number, suffix);
                    }
                }
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    statCards.forEach(card => observer.observe(card));
}

/**
 * Animations Module - Intersection Observer for fade-in effects
 */
function initAnimations() {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Make all elements visible immediately
        document.querySelectorAll('.fade-in').forEach(el => {
            el.classList.add('visible');
        });
        return;
    }

    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
        observer.observe(el);
    });

    // Add fade-in class to elements that should animate
    const animatableElements = [
        '.research-card',
        '.tool-card',
        '.viz-card',
        '.member-card',
        '.publication-item',
        '.highlight-item',
        '.alumni-item',
        '.book-hero'
    ];

    animatableElements.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
            if (!el.classList.contains('fade-in')) {
                el.classList.add('fade-in');
                // Add stagger classes
                const staggerClass = `stagger-${(index % 6) + 1}`;
                el.classList.add(staggerClass);
            }
            observer.observe(el);
        });
    });

    // Section headers animation
    document.querySelectorAll('.section-header').forEach(header => {
        header.classList.add('fade-in');
        observer.observe(header);
    });

    // Hero text animation
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        // Split text into words for animation
        const text = heroTitle.innerHTML;
        const words = text.split(/(<[^>]+>|\s+)/).filter(word => word.trim());

        let wordIndex = 0;
        heroTitle.innerHTML = words.map(word => {
            if (word.startsWith('<')) {
                return word;
            }
            if (word.trim()) {
                wordIndex++;
                return `<span class="word" style="animation-delay: ${wordIndex * 0.1}s">${word}</span>`;
            }
            return word;
        }).join(' ');
    }
}

/**
 * Image Modal Module
 */
function initImageModal() {
    const modal = document.querySelector('.image-modal');
    const modalImg = modal?.querySelector('.modal-image-panel img');
    const modalTitle = modal?.querySelector('.modal-title');
    const modalDesc = modal?.querySelector('.modal-description');
    const modalClose = modal?.querySelector('.modal-close');

    if (!modal || !modalImg) return;

    let previousFocusElement = null;

    // Get all focusable elements within the modal
    function getFocusableElements() {
        return modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    }

    // Open modal when clicking visualization images
    document.querySelectorAll('.viz-card img').forEach(img => {
        img.addEventListener('click', function() {
            previousFocusElement = document.activeElement;
            modalImg.src = this.src;
            modalImg.alt = this.alt;

            // Populate info panel from the parent viz-card
            const card = this.closest('.viz-card');
            if (card) {
                const title = card.querySelector('.viz-info h5');
                const desc = card.querySelector('.viz-info p');
                if (modalTitle) modalTitle.textContent = title ? title.textContent : '';
                if (modalDesc) modalDesc.textContent = desc ? desc.textContent : '';
            }

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            // Focus the close button when modal opens
            if (modalClose) {
                modalClose.focus();
            }
        });
    });

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Restore focus to the element that opened the modal
        if (previousFocusElement) {
            previousFocusElement.focus();
            previousFocusElement = null;
        }
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close with Escape key + focus trap
    document.addEventListener('keydown', function(e) {
        if (!modal.classList.contains('active')) return;

        if (e.key === 'Escape') {
            closeModal();
            return;
        }

        // Focus trap: keep Tab within modal
        if (e.key === 'Tab') {
            const focusable = getFocusableElements();
            if (focusable.length === 0) return;

            const firstFocusable = focusable[0];
            const lastFocusable = focusable[focusable.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });
}

/**
 * Contact Form Module
 */
function initContactForm() {
    const form = document.querySelector('#contact-form');

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Get form data
        const name = document.getElementById('contact-name').value.trim();
        const email = document.getElementById('contact-email').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        // Simple validation
        if (!name || !email || !message) {
            showNotification(window.currentLang === 'zh' ? '請填寫所有欄位。' : 'Please fill in all fields.', 'error');
            return;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification(window.currentLang === 'zh' ? '請輸入有效的電子郵件地址。' : 'Please enter a valid email address.', 'error');
            return;
        }

        // Compose email using mailto
        const recipient = 'wenta.tseng@mail.ntust.edu.tw';
        const subject = encodeURIComponent(`[L-DAHS Website] Message from ${name}`);
        const body = encodeURIComponent(
            `Name: ${name}\n` +
            `Email: ${email}\n\n` +
            `Message:\n${message}\n\n` +
            `---\nSent from L-DAHS Lab Website Contact Form`
        );

        // Open email client
        const mailtoLink = `mailto:${recipient}?subject=${subject}&body=${body}`;
        window.location.href = mailtoLink;

        // Show notification
        showNotification(window.currentLang === 'zh' ? '正在開啟郵件客戶端...' : 'Opening your email client...', 'success');
    });
}

/**
 * Notification Helper
 */
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close" aria-label="Close notification">&times;</button>
    `;

    // Add styles
    notification.style.cssText = `
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 16px 24px;
        background: ${type === 'success' ? 'var(--sage-500, #5d7a6e)' : type === 'error' ? '#c44040' : 'var(--ink-700, #363d52)'};
        color: var(--paper-50, #fdfcfa);
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(26, 31, 46, 0.2);
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 3000;
        font-family: 'DM Sans', sans-serif;
        font-size: 0.9375rem;
        animation: slideUp 0.3s ease;
    `;

    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: inherit;
        font-size: 1.25rem;
        cursor: pointer;
        opacity: 0.8;
        transition: opacity 0.2s;
    `;

    // Add animation keyframes
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Close button functionality
    closeBtn.addEventListener('click', () => notification.remove());

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

/**
 * Scroll to Top Module
 */
function initScrollToTop() {
    const scrollTopBtn = document.querySelector('.scroll-top');

    if (!scrollTopBtn) return;

    // Show/hide button based on scroll position (throttled)
    const handleScrollTop = throttle(function() {
        if (window.scrollY > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }, 100);

    window.addEventListener('scroll', handleScrollTop);

    // Scroll to top on click
    scrollTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/**
 * Dark Mode Module
 */
function initDarkMode() {
    // Create toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'dark-mode-toggle';
    toggleBtn.setAttribute('aria-label', 'Toggle dark mode');
    toggleBtn.innerHTML = '<span class="material-icons">dark_mode</span>';
    document.body.appendChild(toggleBtn);

    // Check for saved preference, then fall back to OS preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleBtn.innerHTML = '<span class="material-icons">light_mode</span>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        toggleBtn.innerHTML = '<span class="material-icons">dark_mode</span>';
    }

    // Toggle dark mode
    toggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            toggleBtn.innerHTML = '<span class="material-icons">dark_mode</span>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggleBtn.innerHTML = '<span class="material-icons">light_mode</span>';
        }
    });
}

/**
 * Language Toggle Module (i18n)
 */
function initLanguageToggle() {
    // Translation data
    const translations = {
        en: {
            // Navigation
            'nav-home': 'Home',
            'nav-about': 'About',
            'nav-research': 'Research',
            'nav-outputs': 'Outputs',
            'nav-team': 'Team',
            'nav-books': 'Books',
            'nav-publications': 'Publications',
            'nav-contact': 'Contact',

            // Hero
            'hero-label': 'Research Excellence',
            'hero-title': 'Lab of Data Analytics in',
            'hero-title-highlight': 'Human Science',
            'hero-subtitle': 'Advancing quantitative research in foreign language acquisition through innovative statistical modeling and data analytics',
            'hero-btn-research': 'Explore Research',
            'hero-btn-team': 'Meet Our Team',
            'stat-publications': 'Publications',
            'stat-research': 'Research Areas',
            'stat-tools': 'Interactive Tools',

            // About
            'about-label': 'About Us',
            'about-title': 'Our Research Mission',
            'about-text': 'Our research lab focuses on quantitative methods in social science research, with particular emphasis on foreign language acquisition studies. We employ cutting-edge statistical techniques and data analytics to understand complex patterns in language learning and social phenomena.',
            'about-quote': 'Bridging the gap between advanced statistical methodology and meaningful insights in human science research.',

            // Highlights
            'highlight-analytics': 'Advanced Analytics',
            'highlight-analytics-desc': 'Structural equation modeling and multivariate statistics',
            'highlight-language': 'Language Research',
            'highlight-language-desc': 'Quantitative approaches to foreign language acquisition',
            'highlight-modeling': 'Statistical Modeling',
            'highlight-modeling-desc': 'Item response theory and multilevel modeling',
            'highlight-cat': 'CAT Development',
            'highlight-cat-desc': 'Computerized Adaptive Testing systems',

            // Leadership
            'leadership-label': 'Leadership',
            'leadership-title': 'Lab Director',
            'director-name': 'Professor Wen-Ta Tseng',
            'director-title': 'Director & Principal Investigator',
            'education': 'Education',
            'director-edu': 'Ph.D., University of Nottingham, United Kingdom',
            'research-areas': 'Research Areas',
            'tag-sem': 'Structural Equation Modeling',
            'tag-multivariate': 'Multivariate Statistics',
            'tag-irt': 'Item Response Theory',
            'tag-mlm': 'Multilevel Modeling',
            'tag-meta': 'Meta-Analysis',
            'tag-fla': 'Foreign Language Acquisition',
            'contact-info': 'Contact Information',
            'director-office': 'Office: T4-816, 4th Teaching Building',
            'director-phone': 'Phone: (02) 2737-6268',
            'director-email': 'Email: wenta.tseng@mail.ntust.edu.tw',

            // Research
            'research-label': 'Research',
            'research-title': 'Research Areas',
            'research-desc': 'Our lab specializes in advanced quantitative methods to understand complex phenomena in human science and language acquisition.',
            'research-sem': 'Structural Equation Modeling',
            'research-sem-desc': 'Advanced statistical techniques for analyzing complex relationships between latent and observed variables in social science research.',
            'research-multivariate': 'Multivariate Statistics',
            'research-multivariate-desc': 'Comprehensive analysis of multiple variables simultaneously to understand complex data patterns in educational and social contexts.',
            'research-irt': 'Item Response Theory',
            'research-irt-desc': 'Mathematical framework for designing, analyzing, and scoring tests and questionnaires in educational assessment.',
            'research-mlm': 'Multilevel Modeling',
            'research-mlm-desc': 'Statistical analysis of hierarchical data structures to account for nested relationships in social science research.',
            'research-meta': 'Meta-Analysis',
            'research-meta-desc': 'Systematic review and synthesis of research findings across multiple studies to provide comprehensive evidence.',
            'research-fla': 'Foreign Language Acquisition',
            'research-fla-desc': 'Quantitative investigation of second and foreign language learning processes, individual differences, and learning outcomes.',

            // Outputs
            'outputs-label': 'Outputs',
            'outputs-title': 'Research Outputs',
            'tools-title': 'Interactive Educational Tools',
            'software-title': 'Research Software Development',
            'viz-title': 'Research Visualizations',

            // Tool Cards
            'tool-textmining': 'Text Mining Tutorial',
            'tool-textmining-desc': 'Interactive tutorial for learning text mining techniques and applications in language research.',
            'tool-sla': 'SLA Course App',
            'tool-sla-desc': 'Comprehensive Second Language Acquisition course materials and interactive learning modules.',
            'tool-writing': 'Academic Writing App',
            'tool-writing-desc': 'Interactive application for improving academic writing skills and understanding writing processes.',
            'tool-fla': 'First Language Acquisition',
            'tool-fla-desc': 'Interactive educational tool exploring theories and stages of first language development.',
            'tool-critical': 'Critical Period Neurolinguistics',
            'tool-critical-desc': 'Interactive tool exploring the critical period hypothesis and neurolinguistic aspects of language acquisition.',
            'tool-n400': 'N400-P600 Analysis',
            'tool-n400-desc': 'Interactive tool for analyzing event-related potentials (N400 and P600) in morphological processing research.',
            'launch-tool': 'Launch Tool',

            // MetaSEM Software
            'metasem-title': 'Enhanced MetaSEM',
            'metasem-desc': 'Advanced meta-analytic structural equation modeling software with interactive web interface for comprehensive statistical analysis.',
            'viz-data-input': 'Data Input Module',
            'viz-data-input-desc': 'User-friendly data input interface with multiple import options and validation features.',
            'viz-datasets': 'Built-in Datasets',
            'viz-datasets-desc': 'Comprehensive collection of sample datasets for meta-analysis and SEM practice.',
            'viz-pub-bias': 'Publication Bias Analysis',
            'viz-pub-bias-desc': 'Advanced statistical tests for detecting and correcting publication bias in meta-analyses.',
            'viz-cluster': 'Cluster Analysis Tools',
            'viz-cluster-desc': 'Sophisticated clustering algorithms for identifying patterns in meta-analytic data.',
            'viz-process-mining': 'Process Mining Network',
            'viz-process-mining-desc': 'Interactive network visualization for process mining and transition analysis.',

            // Language Acquisition Visualizations
            'viz-lang-section': 'Language Acquisition Theory Analysis',
            'viz-evolution': 'Evolution Timeline',
            'viz-evolution-desc': 'Historical development of language acquisition theories from behaviorism to modern approaches.',
            'viz-comparison': 'Theory Comparison',
            'viz-comparison-desc': 'Comprehensive comparison of major language acquisition theories across key dimensions.',
            'viz-details': 'Detailed Analysis',
            'viz-details-desc': 'In-depth analysis of core mechanisms and principles in language acquisition theories.',
            'viz-cross-theory': 'Cross-Theory Analysis',
            'viz-cross-theory-desc': 'Additional comparative analysis of language acquisition theories and their applications.',
            'viz-framework': 'Theory Framework',
            'viz-framework-desc': 'Comprehensive theoretical framework analysis and methodological comparisons.',

            // Statistical Learning Visualizations
            'viz-stat-section': 'Statistical Learning in Language',
            'viz-stat-overview': 'Statistical Learning Overview',
            'viz-stat-overview-desc': 'Core concepts and mechanisms of statistical learning in language acquisition.',
            'viz-phenomena': 'Phenomena Explanations',
            'viz-phenomena-desc': 'How different theories explain specific language learning phenomena and patterns.',
            'viz-teaching': 'Teaching Applications',
            'viz-teaching-desc': 'Practical applications of usage-based theory in language teaching and intervention.',
            'viz-concepts': 'Core Concepts',
            'viz-concepts-desc': 'Fundamental concepts and principles underlying statistical learning mechanisms.',
            'viz-mechanisms': 'Learning Mechanisms',
            'viz-mechanisms-desc': 'Detailed exploration of statistical learning mechanisms in language acquisition.',
            'viz-evidence': 'Empirical Evidence',
            'viz-evidence-desc': 'Research findings and empirical evidence supporting statistical learning theories.',

            // Members
            'members-label': 'Team',
            'members-title': 'Lab Members',
            'fellow-title': 'International Research Fellow',
            'assistant-title': 'Research Assistants',
            'luna-position': 'Post-Doctoral Researcher, University of Oulu',
            'luna-research': 'Research Focus: Human-AI collaboration in education, Language development in AI-supported learning, Assessment of learning with AI',
            'tag-human-ai': 'Human-AI Collaboration',
            'tag-tel': 'Technology-Enhanced Learning',
            'tag-cdst': 'Complex Dynamic Systems Theory',
            'tag-la': 'Learning Analytics',
            'tag-edustats': 'Educational Statistics',
            'tag-rai': 'Responsible AI',
            'cheng-name': 'Cheng, Chao-Hsiang',
            'cheng-position': 'Research Assistant, National Taiwan University of Science and Technology',
            'cheng-research': 'Research Focus: Data and Text Mining, App Development, Chatbot',
            'tag-programming': 'Programming',
            'tag-data-analytics': 'Data Analytics',
            'tag-ml': 'Machine Learning',
            'tag-nlp': 'Natural Language Processing',

            // Books
            'books-label': 'Publications',
            'books-title': 'Published Works',
            'about-book': 'About This Book',
            'purchase': 'Purchase Now',
            'book-title-zh': '社會科學的文本分析：R的應用',
            'book-title-en': 'Text Analysis in Social Sciences: Applications of R',
            'book-author-label': 'Author',
            'book-author-name': 'Prof. Wen-Ta Tseng',
            'book-author-affil': 'Department of Applied Foreign Languages, NTUST',
            'book-publisher-label': 'Publisher',
            'book-publisher': 'Wu-Nan Book Inc.',
            'book-date-label': 'Publication Date',
            'book-date': 'August 2025',
            'book-pages-label': 'Pages',
            'book-desc': 'This book systematically introduces how to use R programming for text analysis, covering text corpus structure and preprocessing, clustering and similarity analysis, sentiment analysis, and machine learning. Using a problem-oriented practical approach, it is suitable for text data analysis in social sciences, literature, and business fields.',
            'book-ch1': 'Text Corpus Structure & Preprocessing',
            'book-ch2': 'Text Visualization Techniques',
            'book-ch3': 'Clustering & Similarity Analysis',
            'book-ch4': 'Sentiment Analysis Methods',
            'book-ch5': 'ML for Text Classification',
            'book-ch6': 'Practical Case Studies',

            // Publications
            'publications-label': 'Research',
            'publications-title': 'Publications',
            'publications-desc': 'A comprehensive collection of peer-reviewed research publications from our lab.',
            'search-placeholder': 'Search publications...',
            'filter-all': 'All Years',
            'papers': 'papers',
            'paper': 'paper',

            // Contact
            'contact-label': 'Connect',
            'contact-title': 'Contact Us',
            'lab-info': 'Lab Information',
            'location': 'Location',
            'phone': 'Phone',
            'email': 'Email',
            'get-in-touch': 'Get in Touch',
            'contact-address': 'T4-816, 4th Teaching Building\nNational Taiwan University of Science and Technology\nNo. 43, Section 4, Keelung Road, Da\'an District\nTaipei City 10607, Taiwan',
            'your-name': 'Your Name',
            'your-email': 'Your Email',
            'your-message': 'Your Message',
            'send-message': 'Send Message',

            // Footer
            'footer-lab-name': 'Lab of Data Analytics in Human Science',
            'footer-desc': 'Advancing quantitative research in human science through innovative statistical methods and data analytics at National Taiwan University of Science and Technology.',
            'quick-links': 'Quick Links',
            'footer-contact': 'Contact',
            'footer-address': 'T4-816, 4th Teaching Building\nNational Taiwan University of Science and Technology\nNo. 43, Sec. 4, Keelung Rd., Da\'an Dist.\nTaipei City 10607, Taiwan'
        },
        zh: {
            // Navigation
            'nav-home': '首頁',
            'nav-about': '關於我們',
            'nav-research': '研究領域',
            'nav-outputs': '研究成果',
            'nav-team': '團隊成員',
            'nav-books': '著作',
            'nav-publications': '學術論文',
            'nav-contact': '聯絡我們',

            // Hero
            'hero-label': '卓越研究',
            'hero-title': '人文科學',
            'hero-title-highlight': '資料分析實驗室',
            'hero-subtitle': '透過創新的統計建模與資料分析，推進外語習得的量化研究',
            'hero-btn-research': '探索研究',
            'hero-btn-team': '認識團隊',
            'stat-publications': '學術論文',
            'stat-research': '研究領域',
            'stat-tools': '互動工具',

            // About
            'about-label': '關於我們',
            'about-title': '研究使命',
            'about-text': '本實驗室專注於社會科學研究的量化方法，特別著重於外語習得研究。我們運用先進的統計技術與資料分析，以理解語言學習和社會現象中的複雜模式。',
            'about-quote': '在先進統計方法學與人文科學研究的有意義洞見之間搭建橋樑。',

            // Highlights
            'highlight-analytics': '進階分析',
            'highlight-analytics-desc': '結構方程模型與多變量統計',
            'highlight-language': '語言研究',
            'highlight-language-desc': '外語習得的量化方法',
            'highlight-modeling': '統計建模',
            'highlight-modeling-desc': '試題反應理論與多層次模型',
            'highlight-cat': 'CAT 開發',
            'highlight-cat-desc': '電腦化適性測驗系統',

            // Leadership
            'leadership-label': '領導團隊',
            'leadership-title': '實驗室主持人',
            'director-name': '曾文達 教授',
            'director-title': '主持人暨首席研究員',
            'education': '學歷',
            'director-edu': '英國諾丁漢大學博士',
            'research-areas': '研究領域',
            'tag-sem': '結構方程模型',
            'tag-multivariate': '多變量統計',
            'tag-irt': '試題反應理論',
            'tag-mlm': '多層次模型',
            'tag-meta': '後設分析',
            'tag-fla': '外語習得',
            'contact-info': '聯絡資訊',
            'director-office': '辦公室：第四教學大樓 T4-816',
            'director-phone': '電話：(02) 2737-6268',
            'director-email': '電子郵件：wenta.tseng@mail.ntust.edu.tw',

            // Research
            'research-label': '研究',
            'research-title': '研究領域',
            'research-desc': '本實驗室專精於先進的量化方法，以理解人文科學與語言習得中的複雜現象。',
            'research-sem': '結構方程模型',
            'research-sem-desc': '用於分析社會科學研究中潛在變項與觀察變項之間複雜關係的進階統計技術。',
            'research-multivariate': '多變量統計',
            'research-multivariate-desc': '同時分析多個變項，以理解教育與社會情境中的複雜資料模式。',
            'research-irt': '試題反應理論',
            'research-irt-desc': '用於教育評量中測驗與問卷的設計、分析和計分的數學框架。',
            'research-mlm': '多層次模型',
            'research-mlm-desc': '針對階層式資料結構進行統計分析，以考量社會科學研究中的巢狀關係。',
            'research-meta': '後設分析',
            'research-meta-desc': '系統性回顧與綜合多項研究的研究發現，以提供全面性的證據。',
            'research-fla': '外語習得',
            'research-fla-desc': '對第二語言與外語學習過程、個體差異及學習成效的量化研究。',

            // Outputs
            'outputs-label': '成果',
            'outputs-title': '研究成果',
            'tools-title': '互動式教育工具',
            'software-title': '研究軟體開發',
            'viz-title': '研究視覺化',

            // 工具卡片
            'tool-textmining': '文本探勘教學',
            'tool-textmining-desc': '學習文本探勘技術及其在語言研究中應用的互動式教學。',
            'tool-sla': '二語習得課程應用',
            'tool-sla-desc': '完整的第二語言習得課程教材與互動式學習模組。',
            'tool-writing': '學術寫作應用',
            'tool-writing-desc': '提升學術寫作能力並理解寫作過程的互動式應用程式。',
            'tool-fla': '第一語言習得',
            'tool-fla-desc': '探索第一語言發展理論與階段的互動式教育工具。',
            'tool-critical': '關鍵期神經語言學',
            'tool-critical-desc': '探索語言習得的關鍵期假說與神經語言學面向的互動式工具。',
            'tool-n400': 'N400-P600 分析',
            'tool-n400-desc': '用於分析形態處理研究中事件相關電位（N400 與 P600）的互動式工具。',
            'launch-tool': '開啟工具',

            // MetaSEM 軟體
            'metasem-title': '增強版 MetaSEM',
            'metasem-desc': '具有互動式網頁介面的進階後設分析結構方程模型軟體，支援全面的統計分析。',
            'viz-data-input': '資料輸入模組',
            'viz-data-input-desc': '使用者友善的資料輸入介面，提供多種匯入選項與驗證功能。',
            'viz-datasets': '內建資料集',
            'viz-datasets-desc': '完整的後設分析與結構方程模型練習用範例資料集。',
            'viz-pub-bias': '發表偏誤分析',
            'viz-pub-bias-desc': '用於偵測與校正後設分析中發表偏誤的進階統計檢定。',
            'viz-cluster': '叢集分析工具',
            'viz-cluster-desc': '用於識別後設分析資料模式的精密叢集演算法。',
            'viz-process-mining': '流程探勘網路',
            'viz-process-mining-desc': '用於流程探勘與轉換分析的互動式網路視覺化。',

            // 語言習得視覺化
            'viz-lang-section': '語言習得理論分析',
            'viz-evolution': '演進時間軸',
            'viz-evolution-desc': '語言習得理論從行為主義到現代方法的歷史發展。',
            'viz-comparison': '理論比較',
            'viz-comparison-desc': '主要語言習得理論在關鍵維度上的全面比較。',
            'viz-details': '詳細分析',
            'viz-details-desc': '語言習得理論核心機制與原理的深入分析。',
            'viz-cross-theory': '跨理論分析',
            'viz-cross-theory-desc': '語言習得理論及其應用的補充性比較分析。',
            'viz-framework': '理論框架',
            'viz-framework-desc': '全面的理論框架分析與方法論比較。',

            // 統計學習視覺化
            'viz-stat-section': '語言中的統計學習',
            'viz-stat-overview': '統計學習概述',
            'viz-stat-overview-desc': '語言習得中統計學習的核心概念與機制。',
            'viz-phenomena': '現象解釋',
            'viz-phenomena-desc': '不同理論如何解釋特定的語言學習現象與模式。',
            'viz-teaching': '教學應用',
            'viz-teaching-desc': '使用為本理論在語言教學與介入中的實際應用。',
            'viz-concepts': '核心概念',
            'viz-concepts-desc': '統計學習機制背後的基本概念與原理。',
            'viz-mechanisms': '學習機制',
            'viz-mechanisms-desc': '語言習得中統計學習機制的詳細探討。',
            'viz-evidence': '實證證據',
            'viz-evidence-desc': '支持統計學習理論的研究發現與實證證據。',

            // Members
            'members-label': '團隊',
            'members-title': '實驗室成員',
            'fellow-title': '國際研究員',
            'assistant-title': '研究助理',
            'luna-position': '博士後研究員，芬蘭奧盧大學',
            'luna-research': '研究方向：教育中的人機協作、AI 輔助學習中的語言發展、AI 學習評估',
            'tag-human-ai': '人機協作',
            'tag-tel': '科技增強學習',
            'tag-cdst': '複雜動態系統理論',
            'tag-la': '學習分析',
            'tag-edustats': '教育統計',
            'tag-rai': '負責任 AI',
            'cheng-name': '鄭兆翔',
            'cheng-position': '研究助理，國立臺灣科技大學',
            'cheng-research': '研究方向：資料與文本探勘、應用程式開發、聊天機器人',
            'tag-programming': '程式設計',
            'tag-data-analytics': '資料分析',
            'tag-ml': '機器學習',
            'tag-nlp': '自然語言處理',

            // Books
            'books-label': '出版品',
            'books-title': '著作出版',
            'about-book': '關於本書',
            'purchase': '立即購買',
            'book-title-zh': '社會科學的文本分析：R的應用',
            'book-title-en': 'Text Analysis in Social Sciences: Applications of R',
            'book-author-label': '作者',
            'book-author-name': '曾文達 教授',
            'book-author-affil': '國立臺灣科技大學應用外語系',
            'book-publisher-label': '出版社',
            'book-publisher': '五南圖書出版',
            'book-date-label': '出版日期',
            'book-date': '2025年8月',
            'book-pages-label': '頁數',
            'book-desc': '本書系統性介紹如何使用 R 程式語言進行文本分析，涵蓋文本語料庫結構與前處理、叢集與相似度分析、情感分析及機器學習等內容。採用問題導向的實務方法，適用於社會科學、文學及商業領域的文本資料分析。',
            'book-ch1': '文本語料庫結構與前處理',
            'book-ch2': '文本視覺化技術',
            'book-ch3': '叢集與相似度分析',
            'book-ch4': '情感分析方法',
            'book-ch5': '機器學習文本分類',
            'book-ch6': '實務案例研究',

            // Publications
            'publications-label': '研究',
            'publications-title': '學術論文',
            'publications-desc': '本實驗室同儕審查研究論文的完整收錄。',
            'search-placeholder': '搜尋論文...',
            'filter-all': '所有年份',
            'papers': '篇論文',
            'paper': '篇論文',

            // Contact
            'contact-label': '聯繫',
            'contact-title': '聯絡我們',
            'lab-info': '實驗室資訊',
            'location': '地點',
            'phone': '電話',
            'email': '電子郵件',
            'get-in-touch': '與我們聯繫',
            'contact-address': '第四教學大樓 T4-816\n國立臺灣科技大學\n臺北市大安區基隆路四段43號\n郵遞區號 10607',
            'your-name': '您的姓名',
            'your-email': '您的電子郵件',
            'your-message': '您的訊息',
            'send-message': '發送訊息',

            // Footer
            'footer-lab-name': '人文科學資料分析實驗室',
            'footer-desc': '於國立臺灣科技大學，透過創新的統計方法與資料分析推進人文科學的量化研究。',
            'quick-links': '快速連結',
            'footer-contact': '聯絡方式',
            'footer-address': '第四教學大樓 T4-816\n國立臺灣科技大學\n臺北市大安區基隆路四段43號\n郵遞區號 10607'
        }
    };

    // Get saved language or default to English
    window.currentLang = localStorage.getItem('language') || 'en';

    // Create language toggle button
    const langBtn = document.createElement('button');
    langBtn.className = 'lang-toggle';
    langBtn.setAttribute('aria-label', 'Toggle language');
    langBtn.innerHTML = window.currentLang === 'en' ? '中文' : 'EN';
    document.body.appendChild(langBtn);

    // Apply translations
    function applyTranslations(lang) {
        const t = translations[lang];

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) {
                if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                    el.placeholder = t[key];
                } else if (el.tagName === 'LABEL') {
                    el.textContent = t[key];
                } else if (t[key].includes('\n')) {
                    el.innerHTML = t[key].replace(/\n/g, '<br>');
                } else {
                    el.textContent = t[key];
                }
            }
        });

        // Update document language
        document.documentElement.lang = lang === 'zh' ? 'zh-TW' : 'en';

        // Update language button text
        langBtn.innerHTML = lang === 'en' ? '中文' : 'EN';

        // Save preference
        localStorage.setItem('language', lang);
        window.currentLang = lang;
    }

    // Toggle language
    langBtn.addEventListener('click', () => {
        const newLang = window.currentLang === 'en' ? 'zh' : 'en';
        applyTranslations(newLang);
    });

    // Apply saved language on load (if Chinese was saved)
    if (window.currentLang === 'zh') {
        applyTranslations('zh');
    }
}

/**
 * Publications Filter Module
 */
function initPublicationsFilter() {
    const publicationsSection = document.querySelector('.publications');
    if (!publicationsSection) return;

    const timeline = publicationsSection.querySelector('.publications-timeline');
    const yearGroups = timeline.querySelectorAll('.year-group');

    // Create filter controls
    const filterContainer = document.createElement('div');
    filterContainer.className = 'publications-filter';

    // Get all years
    const years = [];
    yearGroups.forEach(group => {
        const yearLabel = group.querySelector('.year-label');
        if (yearLabel) {
            years.push(yearLabel.textContent);
        }
    });

    filterContainer.innerHTML = `
        <div class="filter-controls">
            <div class="search-box">
                <span class="material-icons">search</span>
                <input type="text" class="search-input" data-i18n="search-placeholder" placeholder="Search publications...">
            </div>
            <div class="year-filter">
                <div class="year-box">
                    <span class="material-icons">calendar_today</span>
                    <select class="year-select">
                        <option value="all" data-i18n="filter-all">All Years</option>
                        ${years.map(year => `<option value="${year}">${year}</option>`).join('')}
                    </select>
                </div>
            </div>
        </div>
        <div class="filter-results"></div>
    `;

    // Insert before timeline
    timeline.parentNode.insertBefore(filterContainer, timeline);

    const searchInput = filterContainer.querySelector('.search-input');
    const yearSelect = filterContainer.querySelector('.year-select');
    const resultsDiv = filterContainer.querySelector('.filter-results');

    // Filter function
    function filterPublications() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedYear = yearSelect.value;
        let visibleCount = 0;
        let totalCount = 0;

        yearGroups.forEach(group => {
            const yearLabel = group.querySelector('.year-label').textContent;
            const publications = group.querySelectorAll('.publication-item');
            let yearVisible = false;

            publications.forEach(pub => {
                totalCount++;
                const title = pub.querySelector('h4')?.textContent.toLowerCase() || '';
                const authors = pub.querySelector('.authors')?.textContent.toLowerCase() || '';
                const journal = pub.querySelector('.journal')?.textContent.toLowerCase() || '';

                const matchesSearch = !searchTerm ||
                    title.includes(searchTerm) ||
                    authors.includes(searchTerm) ||
                    journal.includes(searchTerm);

                const matchesYear = selectedYear === 'all' || yearLabel === selectedYear;

                if (matchesSearch && matchesYear) {
                    pub.style.display = '';
                    visibleCount++;
                    yearVisible = true;
                } else {
                    pub.style.display = 'none';
                }
            });

            // Show/hide year group based on whether any publications are visible
            group.style.display = yearVisible ? '' : 'none';
        });

        // Update results count
        if (searchTerm || selectedYear !== 'all') {
            const paperWord = window.currentLang === 'zh' ? '篇論文' : (visibleCount === 1 ? 'paper' : 'papers');
            resultsDiv.textContent = `${visibleCount} ${paperWord}`;
            resultsDiv.style.display = 'block';
        } else {
            resultsDiv.style.display = 'none';
        }
    }

    // Event listeners
    searchInput.addEventListener('input', debounce(filterPublications, 300));
    yearSelect.addEventListener('change', filterPublications);
}

/**
 * Utility Functions
 */

// Debounce function for performance
function debounce(func, wait = 20) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
