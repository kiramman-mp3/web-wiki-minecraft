import { httpsUrl } from './safeUrl.js';

// Reddit blocks cross-origin requests from the browser, so the JSON has to go
// through a CORS proxy. `{url}` is replaced with the encoded Reddit URL.
// NOTE: the anonymous corsproxy.io endpoint now answers 403 "keyless_legacy_url".
// Point this to a proxy you control (or one that works without a key) when needed.
export const REDDIT_PROXY = 'https://corsproxy.io/?{url}';

const REQUEST_TIMEOUT_MS = 8000;

function proxied(targetUrl) {
  return REDDIT_PROXY.replace('{url}', encodeURIComponent(targetUrl));
}

function pickImage(post) {
  const preview = post.preview?.images?.[0]?.source?.url;
  const oembed = post.media?.oembed?.thumbnail_url;
  const thumbnail = post.thumbnail;
  // Reddit escapes ampersands in preview URLs.
  return httpsUrl((preview || oembed || thumbnail || '').replace(/&amp;/g, '&'));
}

function toArticle(post, subreddit) {
  const text = (post.selftext || '').trim();
  return {
    title: post.title,
    description: text
      ? text.length > 150 ? `${text.substring(0, 150)}…` : text
      : `Publicado por u/${post.author} en r/${subreddit}`,
    url: `https://www.reddit.com${post.permalink}`,
    urlToImage: pickImage(post),
    date: new Date(post.created_utc * 1000).toLocaleDateString('es')
  };
}

/**
 * Fetches the newest safe-for-work posts of a subreddit.
 * Resolves with an array (possibly empty) and rejects when the request fails,
 * so callers can tell "no posts" apart from "service unavailable".
 */
export async function fetchMinecraftNews(subreddit = 'minecraft') {
  const target = `https://www.reddit.com/r/${encodeURIComponent(subreddit)}/new.json?limit=25`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(proxied(target), { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Reddit proxy respondió ${response.status}`);
    }

    const payload = await response.json();
    const children = payload?.data?.children;
    if (!Array.isArray(children)) {
      throw new Error('Respuesta de Reddit con formato inesperado');
    }

    return children
      .map(child => child.data)
      .filter(post => post && !post.over_18 && post.thumbnail !== 'self')
      .map(post => toArticle(post, subreddit));
  } finally {
    clearTimeout(timer);
  }
}
