import { copyFile, readdir, readFile, rm, writeFile } from 'node:fs/promises';
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

await copyFile('CNAME', 'docs/CNAME');
await writeFile('docs/.nojekyll', '');
await rm('docs/.kujo-llms-collections.tmp', { force: true });
await rm('docs/.kujo-sitemap.tmp', { force: true });
await normalizeGeneratedText('docs');
