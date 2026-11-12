/**
 * CarouselController.js
 * Home hero carousel: starts autoplay unless the user prefers reduced motion
 * and wires an explicit pause/play button (WCAG 2.2.2).
 */

const INTERVAL_MS = 7000;

export function initHeroCarousel() {
  const element = document.getElementById('heroCarousel');
  const button = document.getElementById('heroPause');
  if (!element || !button || !window.bootstrap) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const carousel = window.bootstrap.Carousel.getOrCreateInstance(element, {
    interval: INTERVAL_MS,
    ride: reduceMotion ? false : 'carousel',
    pause: false
  });

  let paused = reduceMotion;
  const render = () => {
    button.classList.toggle('is-paused', paused);
    button.setAttribute('aria-label', paused ? 'Reanudar carrusel' : 'Pausar carrusel');
  };
  render();

  button.addEventListener('click', () => {
    paused = !paused;
    if (paused) carousel.pause();
    else carousel.cycle();
    render();
  });
}
