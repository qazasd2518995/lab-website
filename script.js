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

    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Active nav link highlighting
    const sections = document.querySelectorAll('section[id]');

    function highlightNavLink() {
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
    }

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

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = `${scrollPercent}%`;
    });
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
    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    const heroVisual = document.querySelector('.hero-visual');

    if (hero && heroVisual) {
        window.addEventListener('scroll', function() {
            const scrolled = window.pageYOffset;
            const rate = scrolled * 0.3;

            if (scrolled < window.innerHeight) {
                heroVisual.style.transform = `translateY(${rate}px)`;
            }
        });
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
    const modalImg = modal?.querySelector('img');
    const modalClose = modal?.querySelector('.modal-close');

    if (!modal || !modalImg) return;

    // Open modal when clicking visualization images
    document.querySelectorAll('.viz-card img').forEach(img => {
        img.addEventListener('click', function() {
            modalImg.src = this.src;
            modalImg.alt = this.alt;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    // Close modal
    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
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
    notification.innerHTML = `
        <span class="notification-message">${message}</span>
        <button class="notification-close">&times;</button>
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

    // Show/hide button based on scroll position
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 500) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });

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

    // Check for saved preference - default to light mode
    const savedTheme = localStorage.getItem('theme');

    // Only apply dark mode if explicitly saved as 'dark'
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggleBtn.innerHTML = '<span class="material-icons">light_mode</span>';
    } else {
        // Default to light mode
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
            'director-title': 'Director & Principal Investigator',
            'education': 'Education',
            'research-areas': 'Research Areas',
            'contact-info': 'Contact Information',

            // Research
            'research-label': 'Research',
            'research-title': 'Research Areas',
            'research-desc': 'Our lab specializes in advanced quantitative methods to understand complex phenomena in human science and language acquisition.',

            // Outputs
            'outputs-label': 'Outputs',
            'outputs-title': 'Research Outputs',
            'tools-title': 'Interactive Educational Tools',
            'software-title': 'Research Software Development',
            'viz-title': 'Research Visualizations',

            // Members
            'members-label': 'Team',
            'members-title': 'Lab Members',
            'fellow-title': 'International Research Fellow',
            'assistant-title': 'Research Assistants',

            // Books
            'books-label': 'Publications',
            'books-title': 'Published Works',
            'about-book': 'About This Book',
            'purchase': 'Purchase Now',

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
            'your-name': 'Your Name',
            'your-email': 'Your Email',
            'your-message': 'Your Message',
            'send-message': 'Send Message',

            // Footer
            'footer-desc': 'Advancing quantitative research in human science through innovative statistical methods and data analytics at National Taiwan University of Science and Technology.',
            'quick-links': 'Quick Links'
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
            'director-title': '主持人暨首席研究員',
            'education': '學歷',
            'research-areas': '研究領域',
            'contact-info': '聯絡資訊',

            // Research
            'research-label': '研究',
            'research-title': '研究領域',
            'research-desc': '本實驗室專精於先進的量化方法，以理解人文科學與語言習得中的複雜現象。',

            // Outputs
            'outputs-label': '成果',
            'outputs-title': '研究成果',
            'tools-title': '互動式教育工具',
            'software-title': '研究軟體開發',
            'viz-title': '研究視覺化',

            // Members
            'members-label': '團隊',
            'members-title': '實驗室成員',
            'fellow-title': '國際研究員',
            'assistant-title': '研究助理',

            // Books
            'books-label': '出版品',
            'books-title': '著作出版',
            'about-book': '關於本書',
            'purchase': '立即購買',

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
            'your-name': '您的姓名',
            'your-email': '您的電子郵件',
            'your-message': '您的訊息',
            'send-message': '發送訊息',

            // Footer
            'footer-desc': '於國立臺灣科技大學，透過創新的統計方法與資料分析推進人文科學的量化研究。',
            'quick-links': '快速連結'
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
                <select class="year-select">
                    <option value="all" data-i18n="filter-all">All Years</option>
                    ${years.map(year => `<option value="${year}">${year}</option>`).join('')}
                </select>
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

// Apply throttle to scroll events for better performance
const optimizedScroll = throttle(() => {
    // Any scroll-dependent calculations
}, 100);

window.addEventListener('scroll', optimizedScroll);
