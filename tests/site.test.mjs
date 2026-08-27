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
  assert.match(html, /href="games\/orange-rocket-run\/"/);
  assert.doesNotMatch(html, /Antoniodevore\.com is ready to play/);
  assert.doesNotMatch(html, /id="gameCanvas"/);
  assert.doesNotMatch(html, /ad-game-section/);
  assert.doesNotMatch(html, /assets\/js\/rocket-run\.js/);
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

test('WebMCP discovery exposes the read-only site contract', async () => {
  const index = JSON.parse(await read('docs/.well-known/kujo-site-index.json'));
  const homepage = await read('docs/index.html');
  const runtime = await read('docs/assets/js/kujo-webmcp.js');
  assert.equal(index.schema, 'kujo-ssg-site-index/v1');
  assert.equal(index.site.url, 'https://antoniodevore.com');
  assert.ok(index.items.length > 0);
  assert.deepEqual(['get_site_info', 'search_site', 'list_content', 'get_content'].sort(),
    [...runtime.matchAll(/name:'([^']+)'/g)].map((match) => match[1]).sort());
  assert.equal((homepage.match(/data-kujo-webmcp/g) || []).length, 1);
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

test('header is a full-width sticky bar without a square inner frame', async () => {
  const html = await read('docs/index.html');
  const styles = await read('docs/assets/css/style.css');
  assert.match(html, /assets\/css\/style\.css\?v=20260809-5/);
  assert.match(html, /assets\/js\/site\.js\?v=20260809-5/);
  assert.match(styles, /\.ad-header \{[\s\S]*position: sticky;[\s\S]*inset-block-start: 0;[\s\S]*background: var\(--ad-white\)/);
  assert.match(styles, /\.ad-header__inner \{[\s\S]*border: 0 !important;[\s\S]*border-radius: var\(--ad-radius-lg\)/);
  assert.match(styles, /\.ad-header__cta:hover \{[^}]*background: var\(--ad-orange-600\) !important;[^}]*color: var\(--ad-white\) !important;/);
});

test('footer credits link to the Kujo ecosystem below the main footer panel', async () => {
  const html = await read('docs/index.html');
  const styles = await read('docs/assets/css/style.css');
  assert.match(html, /class="ad-footer__legal">© 2026 Antonio DeVore\. Built with <a href="https:\/\/kujolang\.ai\/ecosystem\/ssg\/">SSG<\/a> \+ <a href="https:\/\/kujolang\.ai\/ecosystem\/sitekit\/">SiteKit<\/a>\.<\/p>/);
  assert.match(styles, /\.ad-footer \.ad-footer__legal \{[^}]*margin: 1\.5rem auto 0;/);
});

test('game assets stay on the game post and collection tags are readable', async () => {
  const gameHtml = await read('docs/games/orange-rocket-run/index.html');
  const listingHtml = await read('docs/games/index.html');
  const styles = await read('docs/assets/css/style.css');
  assert.match(gameHtml, /assets\/js\/rocket-run\.js\?v=20260809-5/);
  assert.match(listingHtml, /<span class="tag listing-tag">Browser game<\/span><span class="tag listing-tag">Orange Rocket<\/span>/);
  assert.match(styles, /\.listing-card-tags \{[^}]*display: flex;[^}]*gap: var\(--sk-space-2\);/);
  assert.match(styles, /\.listing-tag \{[^}]*border-radius: var\(--ad-radius-pill\);/);
});

test('home hero has no border and links never regain underlines', async () => {
  const styles = await read('docs/assets/css/style.css');
  assert.match(styles, /\.ad-hero \{[^}]*border: 0;/);
  assert.match(styles, /a, a:hover, a:focus, a:active \{ text-decoration: none; \}/);
});
