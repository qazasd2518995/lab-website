/* ==============================================
   L-DAHS — Multi-page interactions
   ============================================== */

(() => {
  'use strict';

  // ────────────  Mobile menu  ────────────
  function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const menu = document.querySelector('.nav-menu');
    if (!hamburger || !menu) return;
    hamburger.addEventListener('click', () => {
      const isActive = menu.classList.toggle('active');
      hamburger.classList.toggle('active', isActive);
      hamburger.setAttribute('aria-expanded', String(isActive));
    });
    menu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        if (menu.classList.contains('active')) {
          menu.classList.remove('active');
          hamburger.classList.remove('active');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  // ────────────  Active nav based on current page  ────────────
  function setupActiveNav() {
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-menu a').forEach(a => {
      const href = a.getAttribute('href');
      if (!href) return;
      const target = href.split('/').pop();
      if (target === path) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  // ────────────  Reveal on scroll  ────────────
  function setupReveal() {
    const elements = document.querySelectorAll('.reveal');
    if (!elements.length || !('IntersectionObserver' in window)) {
      elements.forEach(el => el.classList.add('in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(el => io.observe(el));
    requestAnimationFrame(() => {
      document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('in'));
    });
  }

  // ────────────  Scroll to top  ────────────
  function setupScrollTop() {
    const btn = document.querySelector('.scroll-top');
    if (!btn) return;
    let ticking = false;
    function onScroll() {
      if (window.scrollY > 600) btn.classList.add('visible');
      else btn.classList.remove('visible');
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(onScroll);
        ticking = true;
      }
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ────────────  Copyright year  ────────────
  function setupCopyright() {
    const yearEl = document.getElementById('copyright-year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  // ────────────  Init  ────────────
  document.addEventListener('DOMContentLoaded', () => {
    setupMobileMenu();
    setupActiveNav();
    setupReveal();
    setupScrollTop();
    setupCopyright();
  });
})();
