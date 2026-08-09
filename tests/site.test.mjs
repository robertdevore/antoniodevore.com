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
