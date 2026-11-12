import { httpsUrl } from '../models/safeUrl.js';

const DEFAULT_IMAGE = new URL('../images/news-placeholder.webp', import.meta.url).href;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function createCard(article, { badge }) {
  const col = element('div', 'col-12 col-sm-6 col-lg-3');

  const link = element('a', 'news-tile');
  link.href = httpsUrl(article.url, '#');
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  const img = element('img', 'news-tile__img');
  img.src = httpsUrl(article.urlToImage, DEFAULT_IMAGE);
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => { img.src = DEFAULT_IMAGE; }, { once: true });

  const meta = element('div', 'news-tile__meta');
  if (badge) meta.appendChild(element('span', 'news-tile__chip', badge));
  if (article.date) meta.appendChild(element('time', '', article.date));

  const shade = element('div', 'news-tile__shade');
  shade.append(meta, element('h3', 'news-tile__title', article.title));

  link.append(img, shade);
  col.appendChild(link);
  return col;
}

export function renderNews(articles, containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { limit = 8, badge = '' } = options;
  container.replaceChildren(
    ...articles.slice(0, limit).map(article => createCard(article, { badge }))
  );
  container.removeAttribute('aria-busy');
}

/**
 * Replaces the container content with a loading, empty or error message.
 * `onRetry` adds a retry button (error state only).
 */
export function renderStatus(containerId, state, { message, onRetry } = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const col = element('div', 'col-12');
  const box = element('div', `mc-status mc-status--${state}`);
  box.setAttribute('role', state === 'error' ? 'alert' : 'status');

  if (state === 'loading') {
    const bar = element('div', 'mc-xp-bar');
    bar.setAttribute('aria-hidden', 'true');
    bar.appendChild(element('span', 'mc-xp-bar__fill'));
    box.append(bar, element('p', 'mc-status__text', message));
  } else {
    box.appendChild(element('p', 'mc-status__text', message));
    if (onRetry) {
      const retry = element('button', 'btn-minecraft', 'Reintentar');
      retry.type = 'button';
      retry.addEventListener('click', onRetry);
      box.appendChild(retry);
    }
  }

  col.appendChild(box);
  container.replaceChildren(col);
  container.setAttribute('aria-busy', String(state === 'loading'));
}
