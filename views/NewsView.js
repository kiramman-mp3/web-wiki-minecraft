const DEFAULT_IMAGE = new URL('../images/default-new.jpg', import.meta.url).href;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function safeHttpsUrl(value, fallback) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : fallback;
  } catch {
    return fallback;
  }
}

function createCard(article, { badge, linkLabel }) {
  const col = element('div', 'col-md-6 col-lg-4');
  const card = element('article', 'news-card h-100');

  const img = element('img', 'news-card-img');
  img.src = safeHttpsUrl(article.urlToImage, DEFAULT_IMAGE);
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  img.addEventListener('error', () => { img.src = DEFAULT_IMAGE; }, { once: true });

  const body = element('div', 'news-card-body');
  const meta = element('div', 'news-card-meta');
  if (badge) meta.appendChild(element('span', 'mc-badge', badge));
  if (article.date) meta.appendChild(element('time', '', article.date));

  const link = element('a', 'btn-minecraft mt-auto text-center', linkLabel);
  link.href = safeHttpsUrl(article.url, '#');
  link.target = '_blank';
  link.rel = 'noopener noreferrer';

  body.append(
    meta,
    element('h3', 'news-card-title', article.title),
    element('p', 'news-card-text', article.description),
    link
  );
  card.append(img, body);
  col.appendChild(card);
  return col;
}

export function renderNews(articles, containerId, options = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const { limit = 9, badge = '', linkLabel = 'Leer más' } = options;
  container.replaceChildren(
    ...articles.slice(0, limit).map(article => createCard(article, { badge, linkLabel }))
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
