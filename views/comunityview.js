import { loadFeed } from '../controllers/NewsController.js';

document.addEventListener('DOMContentLoaded', () => {
  // Spanish community first; r/minecraft only if it has nothing to show.
  loadFeed({
    containerId: 'community-stories',
    subreddits: ['minecraftespanol', 'minecraft'],
    limit: 12,
    badge: 'Comunidad',
    linkLabel: 'Ver en Reddit'
  });
});
