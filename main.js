import { initNewsSection } from './controllers/NewsController.js';
import { initUIHelpers } from './controllers/UIController.js';
import { initHeroCarousel } from './controllers/CarouselController.js';

document.addEventListener('DOMContentLoaded', () => {
  initUIHelpers();
  initHeroCarousel();
  // Only init news if the container exists
  if (document.getElementById('minecraft-news')) {
    initNewsSection();
  }
});
