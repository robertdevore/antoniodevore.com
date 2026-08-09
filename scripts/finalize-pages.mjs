import { copyFile, writeFile } from 'node:fs/promises';

await copyFile('CNAME', 'docs/CNAME');
await writeFile('docs/.nojekyll', '');
