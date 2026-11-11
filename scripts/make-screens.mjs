// Turns iPhone screenshots into the light images for the app showcase.
//   1. Put the screenshots in screens-src/ (not committed), named in the order
//      you want them shown, e.g. 1-home.png, 2-next.png …
//   2. npm run screens  → writes public/app/1-home.webp …
//   3. List them (with title, caption and alt text) in src/data/app-screens.ts.
import { mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = join(root, 'screens-src');
const out = join(root, 'public', 'app');
mkdirSync(out, { recursive: true });

const files = readdirSync(src)
  .filter((f) => /\.(png|jpe?g|heic|webp)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
if (!files.length) throw new Error('No screenshots found in screens-src/');

for (const f of files) {
  const name = basename(f, extname(f)).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  const target = join(out, `${name}.webp`);
  // 828 px wide: sharp on a retina screen, where the phone is ~300 px wide.
  const info = await sharp(join(src, f)).rotate().resize({ width: 828 }).webp({ quality: 82 }).toFile(target);
  console.log(`${f} → public/app/${name}.webp (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
}
