// Bundles src/*.js into a single self-contained HTML file.
//   node build.mjs            -> dist/asahi-moth.html
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const src = join(root, 'src');
const out = join(root, 'dist', 'asahi-moth.html');

const scripts = readdirSync(src)
  .filter(f => /^\d\d-.*\.js$/.test(f))
  .sort()
  .map(f => `// ── ${f} ──\n${readFileSync(join(src, f), 'utf8')}`)
  .join('\n');

const html = readFileSync(join(src, 'template.html'), 'utf8').replace('/*__SCRIPTS__*/', () => scripts);

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`built ${out} (${(html.length / 1024).toFixed(1)} KB)`);
