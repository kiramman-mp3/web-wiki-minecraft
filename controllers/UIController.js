/**
 * UIController.js
 * General UI helpers: scroll-to-top button.
 */

const SCROLL_THRESHOLD = 300;

export function initUIHelpers() {
  createScrollToTopButton();
}

function createScrollToTopButton() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'scrollToTop';
  btn.className = 'btn-minecraft scroll-top';
  btn.textContent = '↑';
  btn.setAttribute('aria-label', 'Volver arriba');
  btn.hidden = true;
  document.body.appendChild(btn);

  const toggle = () => {
    btn.hidden = window.scrollY <= SCROLL_THRESHOLD;
  };
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  btn.addEventListener('click', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}
