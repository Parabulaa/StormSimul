import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const required = ['dist/index.html', 'dist/app.js', 'dist/backend.js', 'dist/styles.css', 'vercel.json', 'supabase/schema.sql'];
await Promise.all(required.map((file) => access(path.join(root, file))));
const html = await readFile(path.join(root, 'dist/index.html'), 'utf8');
for (const asset of ['config.js', 'backend.js', 'app.js']) {
  if (!html.includes(asset)) throw new Error(`index.html does not load ${asset}`);
}
console.log('StormSight deployment files look valid.');
