import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(path, 'utf8');

test('homepage keeps the Antonio identity and primary content routes', async () => {
  const html = await read('docs/index.html');
  assert.match(html, /Antonio’s bright little corner/);
  assert.match(html, /href="games\//);
  assert.match(html, /href="images\//);
  assert.match(html, /href="writing\//);
  assert.match(html, /id="gameCanvas"/);
  assert.match(html, /assets\/sitekit\/sitekit\.css/);
});

test('custom collections and content details are generated', async () => {
  const routes = [
    'docs/games/index.html',
    'docs/games/orange-rocket-run/index.html',
    'docs/images/index.html',
    'docs/images/gallery-doors-opening/index.html',
    'docs/writing/index.html',
    'docs/writing/notes-from-the-workshop/index.html'
  ];
  for (const route of routes) assert.ok((await stat(route)).isFile(), `${route} should exist`);
});

test('generated pages do not contain unresolved template placeholders', async () => {
  const pages = ['docs/index.html', 'docs/games/index.html', 'docs/images/index.html', 'docs/writing/index.html'];
  for (const page of pages) assert.doesNotMatch(await read(page), /\{\{[^}]+\}\}/);
});

test('GitHub Pages metadata is generated', async () => {
  assert.equal((await read('docs/CNAME')).trim(), 'antoniodevore.com');
  assert.ok((await stat('docs/.nojekyll')).isFile());
});

test('theme removes blueprint accents and provides an accessible mobile menu', async () => {
  const html = await read('docs/index.html');
  const styles = await read('docs/assets/css/style.css');
  assert.doesNotMatch(html, /ad-sun-grid/);
  assert.match(html, /class="ad-menu-toggle"/);
  assert.match(html, /icon-tabler-menu-2/);
  assert.match(html, /aria-controls="primary-navigation"/);
  assert.match(styles, /\.sk-card::before,[\s\S]*\.sk-card::after \{ content: none; \}/);
  assert.match(styles, /--ad-font-display:/);
});

test('display typography replaces Departure Mono and reveal effects fail open', async () => {
  const styles = await read('docs/assets/css/style.css');
  const script = await read('docs/assets/js/site.js');
  assert.match(styles, /--sk-font-mono: var\(--ad-font-display\)/);
  assert.match(styles, /\[data-reveal\] \{ opacity: 1; transform: none; \}/);
  assert.match(styles, /\.ad-reveal-enabled \[data-reveal\]:not\(\.is-visible\)/);
  assert.match(script, /desktopQuery\.addListener\(closeMenu\)/);
  assert.match(script, /document\.documentElement\.classList\.add\('ad-reveal-enabled'\)/);
  assert.match(script, /catch \{/);
});
