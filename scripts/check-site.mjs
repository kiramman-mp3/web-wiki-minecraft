// Static checks for the HTML pages. No dependencies: `node scripts/check-site.mjs`.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['index.html', ...readdirSync(join(root, 'views')).filter(f => f.endsWith('.html')).map(f => `views/${f}`)];

const errors = [];
const fail = (page, message) => errors.push(`${page}: ${message}`);
const navTargets = new Map();

for (const page of pages) {
  const file = join(root, page);
  const html = readFileSync(file, 'utf8');

  // Local references must exist.
  for (const [, ref] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:|#)/.test(ref)) continue;
    const target = resolve(dirname(file), decodeURIComponent(ref.split(/[?#]/)[0]));
    if (!existsSync(target)) fail(page, `missing file for "${ref}"`);
  }

  // Images need alt text and an explicit loading hint.
  for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\balt=/.test(tag)) fail(page, `<img> without alt: ${tag.slice(0, 80)}`);
  }

  // Unique ids.
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  ids.filter((id, i) => ids.indexOf(id) !== i).forEach(id => fail(page, `duplicate id "${id}"`));

  // Anchors must point to an existing id on the same page.
  for (const [, anchor] of html.matchAll(/\bhref="#([^"]+)"/g)) {
    if (!ids.includes(anchor)) fail(page, `anchor "#${anchor}" has no matching id`);
  }

  if (/\sstyle="/.test(html)) fail(page, 'inline style attribute (blocked by the CSP)');
  if (/target="_blank"(?![^>]*rel="[^"]*noopener)/.test(html)) fail(page, 'target="_blank" without rel="noopener"');
  if (!/http-equiv="Content-Security-Policy"/.test(html)) fail(page, 'missing Content-Security-Policy');
  if (!/<html lang="es"/.test(html)) fail(page, 'missing lang="es"');
  if ((html.match(/<h1\b/g) || []).length !== 1) fail(page, 'expected exactly one <h1>');
  if ((html.match(/<main\b/g) || []).length !== 1) fail(page, 'expected exactly one <main>');
  if ((html.match(/aria-current="page"/g) || []).length !== 1) fail(page, 'expected exactly one aria-current="page"');
  if (/\*\*[^*]+\*\*/.test(html)) fail(page, 'leftover markdown bold markers');

  // Every page must expose the same navigation targets.
  const nav = html.match(/<nav\b[\s\S]*?<\/nav>/)?.[0] ?? '';
  const targets = [...nav.matchAll(/class="nav-link[^"]*" href="([^"]+)"/g)]
    .map(m => resolve(dirname(file), m[1]).replace(root, ''));
  navTargets.set(page, targets.join('|'));
}

if (new Set(navTargets.values()).size > 1) errors.push('navigation differs between pages');

if (errors.length) {
  console.error(errors.map(e => `✖ ${e}`).join('\n'));
  process.exit(1);
}
console.log(`✔ ${pages.length} pages passed the static checks`);
