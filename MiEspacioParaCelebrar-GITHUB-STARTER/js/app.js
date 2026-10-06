(() => {
  'use strict';

  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    nav.addEventListener('click', (event) => {
      if (event.target instanceof HTMLAnchorElement) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const current = new URL(window.location.href).pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav] a[data-page]').forEach((link) => {
    if (link.getAttribute('data-page') === current) {
      link.setAttribute('aria-current', 'page');
    }
  });

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });
})();
