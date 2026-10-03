import { access, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
await Promise.all(['index.html', 'app.js', 'styles.css'].map((file) => access(path.join(dist, file))));

const config = {
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
};

await writeFile(
  path.join(dist, 'config.js'),
  `// Generated at build time. Do not add secret/service-role keys.\nwindow.STORMSIGHT_CONFIG = ${JSON.stringify(config, null, 2)};\n`,
  'utf8',
);
console.log(`StormSight build ready (${config.supabaseUrl && config.supabasePublishableKey ? 'Supabase enabled' : 'demo mode'}).`);
