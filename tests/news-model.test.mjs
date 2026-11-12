import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { fetchMinecraftNews } from '../models/NewsModel.js';
import { httpsUrl } from '../models/safeUrl.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const post = (overrides = {}) => ({
  data: {
    title: 'Mi base',
    selftext: '',
    author: 'steve',
    permalink: '/r/minecraft/comments/abc/mi_base/',
    created_utc: 1700000000,
    over_18: false,
    thumbnail: 'https://i.redd.it/thumb.png',
    ...overrides
  }
});

const mockReddit = (children, init = { status: 200 }) => {
  globalThis.fetch = async () => new Response(JSON.stringify({ data: { children } }), init);
};

test('httpsUrl accepts https and rejects everything else', () => {
  assert.equal(httpsUrl('https://i.redd.it/a.png'), 'https://i.redd.it/a.png');
  assert.equal(httpsUrl('http://i.redd.it/a.png'), '');
  assert.equal(httpsUrl('javascript:alert(1)'), '');
  assert.equal(httpsUrl('data:text/html,<script>alert(1)</script>', '#'), '#');
  assert.equal(httpsUrl('not a url', 'fallback'), 'fallback');
});

test('maps a post to an article', async () => {
  mockReddit([post()]);
  const [article] = await fetchMinecraftNews('minecraft');
  assert.equal(article.title, 'Mi base');
  assert.equal(article.url, 'https://www.reddit.com/r/minecraft/comments/abc/mi_base/');
  assert.equal(article.urlToImage, 'https://i.redd.it/thumb.png');
  assert.equal(article.description, 'Publicado por u/steve en r/minecraft');
});

test('skips NSFW posts and text-only posts', async () => {
  mockReddit([post({ over_18: true }), post({ thumbnail: 'self' }), post({ title: 'Válido' })]);
  const articles = await fetchMinecraftNews();
  assert.deepEqual(articles.map(a => a.title), ['Válido']);
});

test('drops image URLs that are not https', async () => {
  mockReddit([post({ thumbnail: 'http://evil.example/x.png' }), post({ thumbnail: 'javascript:alert(1)' })]);
  const articles = await fetchMinecraftNews();
  assert.deepEqual(articles.map(a => a.urlToImage), ['', '']);
});

test('prefers the preview image and unescapes ampersands', async () => {
  mockReddit([post({ preview: { images: [{ source: { url: 'https://preview.redd.it/a.png?w=1&amp;s=2' } }] } })]);
  const [article] = await fetchMinecraftNews();
  assert.equal(article.urlToImage, 'https://preview.redd.it/a.png?w=1&s=2');
});

test('truncates long self text with an ellipsis', async () => {
  mockReddit([post({ selftext: 'a'.repeat(300) })]);
  const [article] = await fetchMinecraftNews();
  assert.equal(article.description, `${'a'.repeat(150)}…`);
});

test('rejects when the proxy answers with an error status', async () => {
  globalThis.fetch = async () => new Response('{"success":false}', { status: 403 });
  await assert.rejects(fetchMinecraftNews(), /403/);
});

test('rejects on an unexpected payload', async () => {
  globalThis.fetch = async () => new Response(JSON.stringify({ unexpected: true }), { status: 200 });
  await assert.rejects(fetchMinecraftNews(), /formato inesperado/);
});

test('resolves with an empty array when the subreddit has no posts', async () => {
  mockReddit([]);
  assert.deepEqual(await fetchMinecraftNews(), []);
});
