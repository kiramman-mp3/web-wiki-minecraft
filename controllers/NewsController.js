import { fetchMinecraftNews } from '../models/NewsModel.js';
import { renderNews, renderStatus } from '../views/NewsView.js';

/**
 * Loads the first subreddit that returns posts and renders it into `containerId`.
 * Shows loading, empty and error (with retry) states.
 */
export async function loadFeed({ containerId, subreddits, limit, badge, linkLabel }) {
  renderStatus(containerId, 'loading', { message: 'Consultando los archivos de la comunidad…' });

  try {
    for (const subreddit of subreddits) {
      const articles = await fetchMinecraftNews(subreddit);
      if (articles.length > 0) {
        renderNews(articles, containerId, { limit, badge, linkLabel });
        return;
      }
    }
    renderStatus(containerId, 'empty', { message: 'Todavía no hay publicaciones para mostrar.' });
  } catch (error) {
    console.error('Error cargando las publicaciones de Reddit:', error);
    renderStatus(containerId, 'error', {
      message: 'No pudimos conectar con Reddit. Inténtalo de nuevo en unos minutos.',
      onRetry: () => loadFeed({ containerId, subreddits, limit, badge, linkLabel })
    });
  }
}

export function initNewsSection() {
  return loadFeed({ containerId: 'minecraft-news', subreddits: ['minecraft'], limit: 9 });
}
