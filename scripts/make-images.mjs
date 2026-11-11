// Makes the site's images from the app's club badge (scripts/club-badge-source.png,
// a white cut-out on transparent): the hero badge, favicons and the social share
// image. Run with `npm run images` after changing the badge; the results are
// committed in public/, so the build doesn't need this.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import opentype from 'opentype.js';

const ORANGE = '#FD6002'; // pumpkin orange
const BLACK = '#191C1D'; // cobalt grey
const ICE = '#F5EEE9'; // ivory white
const STONE = '#AAA49F'; // warm grey

const root = new URL('../', import.meta.url);
const file = (p) => fileURLToPath(new URL(p, root));
const font = (name) => {
  const buf = readFileSync(file(`node_modules/@fontsource/${name}`));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const barlow = font('barlow-condensed/files/barlow-condensed-latin-700-normal.woff');
const mono = font('ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff');

const n = (v) => (Math.round(v * 100) / 100).toFixed(2);
const pathData = (p) =>
  p.commands
    .map((c) =>
      c.type === 'Z'
        ? 'Z'
        : c.type === 'C'
          ? `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`
          : c.type === 'Q'
            ? `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`
            : `${c.type}${n(c.x)} ${n(c.y)}`,
    )
    .join('');

// Text as an SVG path, so the images don't depend on installed fonts.
function text(f, str, x, y, size, fill, { anchor = 'start', tracking = 0 } = {}) {
  let width = 0;
  const glyphs = f.stringToGlyphs(str);
  const scale = size / f.unitsPerEm;
  for (const g of glyphs) width += g.advanceWidth * scale + tracking;
  width -= tracking;
  let cx = anchor === 'middle' ? x - width / 2 : x;
  let d = '';
  for (const g of glyphs) {
    d += `<path d="${pathData(g.getPath(cx, y, size))}" fill="${fill}"/>`;
    cx += g.advanceWidth * scale + tracking;
  }
  return d;
}

const badge = sharp(file('scripts/club-badge-source.png'));

// Badge PNG, white, 640px.
await badge.clone().resize(640, 640).png().toFile(file('public/club-badge.png'));

// Favicon: "NOC" on a molten orange disc.
const iconSvg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="${size}" height="${size}">
  <circle cx="32" cy="32" r="32" fill="${ORANGE}"/>
  ${text(barlow, 'NOC', 32, 43, 30, BLACK, { anchor: 'middle', tracking: 0.5 })}
</svg>`;
writeFileSync(file('public/favicon.svg'), iconSvg(64));
await sharp(Buffer.from(iconSvg(32))).png().toFile(file('public/favicon-32.png'));

// Apple touch icon: the badge on magma black, square (iOS rounds it).
const touchBadge = await badge.clone().resize(140, 140).toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: BLACK } })
  .composite([{ input: touchBadge, left: 20, top: 20 }])
  .png()
  .toFile(file('public/apple-touch-icon.png'));

// Social share images, 1200 x 630: English (og.png) and Dutch (og-nl.png, for /nl).
const ogBadge = await badge.clone().resize(420, 420).toBuffer();
async function shareImage(lines, address, out) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="${BLACK}"/>
  <rect x="0" y="0" width="12" height="630" fill="${ORANGE}"/>
  ${text(mono, 'NEVERMADE OUTDOOR CLUB', 560, 150, 24, ORANGE, { tracking: 3 })}
  ${text(barlow, lines[0], 556, 260, 96, ICE)}
  ${text(barlow, lines[1], 556, 355, 96, ICE)}
  ${text(barlow, lines[2], 556, 450, 96, ORANGE)}
  ${text(mono, address, 560, 530, 22, STONE, { tracking: 2 })}
</svg>`;
  await sharp(Buffer.from(svg))
    .composite([{ input: ogBadge, left: 80, top: 105 }])
    .png()
    .toFile(file(out));
}
await shareImage(['DO THE THINGS', 'YOU HAVEN’T', 'DONE YET.'], 'NEVERMADEOUTDOORCLUB.COM', 'public/og.png');
await shareImage(['DOE WAT JE', 'NOG NOOIT', 'HEBT GEDAAN.'], 'NEVERMADEOUTDOORCLUB.COM/NL', 'public/og-nl.png');

console.log('images written to public/');

// The hero "sun": the badge in molten orange, rising behind the ridges.
const sunBadge = await badge.clone().resize(640, 640).toBuffer();
await sharp({ create: { width: 640, height: 640, channels: 4, background: ORANGE } })
  .composite([{ input: sunBadge, blend: 'dest-in' }])
  .webp({ quality: 78 })
  .toFile(file('public/club-badge-sun.webp'));

// Small badge for the header (shown at 40px).
await badge.clone().resize(96, 96).webp({ quality: 90 }).toFile(file('public/club-badge-96.webp'));
