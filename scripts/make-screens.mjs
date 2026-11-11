// Turns iPhone screenshots into the images for the app showcase.
//   1. Put the screenshots in screens-src/ (not committed), named in the order
//      you want them shown, e.g. 1-home.png, 2-next.png …
//   2. npm run screens  → writes, per screenshot, the page and its tab bar:
//        public/app/1-home.webp       the page (between status bar and tab bar)
//        public/app/tab-1-home.webp   the tab bar, with that tab highlighted
//      and once: public/app/statusbar.webp (from the first screenshot).
//   3. List them (with title, caption and alt text) in src/data/app-screens.ts.
// The showcase keeps the status bar and tab bar still and slides only the page,
// like swiping between tabs in the app.
import { mkdirSync, readdirSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = join(root, 'screens-src');
const out = join(root, 'public', 'app');
mkdirSync(out, { recursive: true });

// Where the parts meet, as a share of the screenshot's height (measured on
// 921×2000 screenshots: status bar to y=120, tab bar from y=1802).
const STATUS_END = 120 / 2000;
const TABBAR_START = 1802 / 2000;
// Output width: sharp on a retina screen, where the phone is ~300 px wide.
const WIDTH = 828;

const files = readdirSync(src)
  .filter((f) => /\.(png|jpe?g|heic|webp)$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
if (!files.length) throw new Error('No screenshots found in screens-src/');

const part = async (file, top, bottom, target) => {
  const img = sharp(join(src, file)).rotate();
  const { width, height } = await img.metadata();
  const y0 = Math.round(height * top), y1 = Math.round(height * bottom);
  const info = await img
    .extract({ left: 0, top: y0, width, height: y1 - y0 })
    .resize({ width: WIDTH })
    .webp({ quality: 82 })
    .toFile(join(out, target));
  console.log(`${file} → public/app/${target} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
};

for (const [i, f] of files.entries()) {
  const name = basename(f, extname(f)).toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  if (i === 0) await part(f, 0, STATUS_END, 'statusbar.webp');
  await part(f, STATUS_END, TABBAR_START, `${name}.webp`);
  await part(f, TABBAR_START, 1, `tab-${name}.webp`);
}
