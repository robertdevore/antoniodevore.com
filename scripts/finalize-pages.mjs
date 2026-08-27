import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const textExtensions = new Set(['.css', '.html', '.js', '.json', '.md', '.svg', '.txt', '.xml']);

async function normalizeGeneratedText(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await normalizeGeneratedText(path);
    } else if (textExtensions.has(extname(entry.name))) {
      const source = await readFile(path, 'utf8');
      const normalized = `${source.replace(/[\t ]+$/gm, '').trimEnd()}\n`;
      if (normalized !== source) await writeFile(path, normalized);
    }
  }
}

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await htmlFiles(path));
    else if (entry.name.endsWith('.html')) files.push(path);
  }
  return files;
}

async function addWebmcpArtifacts(directory) {
  const files = await htmlFiles(directory);
  const items = [];
  for (const path of files) {
    const source = await readFile(path, 'utf8');
    const relative = path.slice(directory.length + 1).replaceAll('\\', '/');
    const route = relative === 'index.html'
      ? '/'
      : `/${relative.replace(/\/index\.html$/, '/').replace(/\.html$/, '')}/`.replaceAll('//', '/');
    const title = source.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim() || route;
    const description = source.match(/<meta name="description" content="([^"]*)"/i)?.[1]?.trim() || '';
    items.push({
      id: `page:${route}`,
      type: 'pages',
      slug: route === '/' ? 'home' : route.replaceAll('/', '-').replace(/^-|-$/g, ''),
      url: `https://antoniodevore.com${route}`,
      title,
      description,
      summary: description,
      language: 'en',
      searchable: true,
      taxonomies: {}
    });
    if (!relative.endsWith('404.html') && !source.includes('data-kujo-webmcp')) {
      const injected = source.replace('</body>', '  <script src="/assets/js/kujo-webmcp.js" data-kujo-webmcp data-kujo-site-index="/.well-known/kujo-site-index.json" defer></script>\n</body>');
      await writeFile(path, injected);
    }
  }
  const uniqueItems = [...new Map(items.map((item) => [item.url, item])).values()]
    .sort((a, b) => a.url.localeCompare(b.url));
  await mkdir(join(directory, '.well-known'), { recursive: true });
  await writeFile(join(directory, '.well-known', 'kujo-site-index.json'), `${JSON.stringify({
    schema: 'kujo-ssg-site-index/v1',
    generated_by: { name: 'kujo-ssg', version: '1.0.1' },
    site: { title: 'Antonio DeVore', tagline: 'Games, images, writing, and bright experiments.', url: 'https://antoniodevore.com', base_path: '/', language: 'en' },
    navigation: [],
    content_types: [{ name: 'pages', title: 'Pages', count: uniqueItems.length, taxonomies: [] }],
    items: uniqueItems
  }, null, 2)}\n`);
}

await copyFile('CNAME', 'docs/CNAME');
await writeFile('docs/.nojekyll', '');
await rm('docs/.kujo-llms-collections.tmp', { force: true });
await rm('docs/.kujo-sitemap.tmp', { force: true });
await normalizeGeneratedText('docs');
await addWebmcpArtifacts('docs');
