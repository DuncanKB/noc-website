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

// The hero's particle ridge as SVG dots: the same maths as the shader in
// src/components/ParticleRidge.astro, frozen at one moment.
function particleRidge(W, H) {
  const mix = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => {
    const t = clamp((v - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const peak = (x, c, w, h) => h * Math.exp(-(((x - c) / w) ** 2));
  const aspect = W / H;
  const t = 4;
  const cols = 300;
  const rows = 110;
  let dots = '';
  for (let r = 0; r < rows; r++) {
    const z = Math.pow(r / (rows - 1), 0.75);
    for (let c = 0; c < cols; c++) {
      const ax = (c / (cols - 1)) * 2 - 1 + (r % 2 ? 1 / cols : 0);
      const zw = mix(1.4, 9.0, z);
      const xw = ax * zw * 1.15 * Math.max(aspect, 0.8);
      let m =
        peak(xw, 2.6, 2.4, 2.1) +
        peak(xw, -4.2, 2.6, 1.35) +
        peak(xw, -0.6, 1.5, 0.75) +
        peak(xw, 7.5, 3.0, 1.2) +
        0.18 * (1 - Math.abs(Math.sin(xw * 1.7 + 0.4))) +
        0.08 * (1 - Math.abs(Math.sin(xw * 4.1 + z * 9.0)));
      m -= peak(xw, 2.6, 0.35, 0.28);
      const far = smooth(0.15, 0.85, z);
      m *= far;
      const wave = 0.16 * Math.sin(xw * 0.9 + z * 7.0 - t * 0.55) + 0.08 * Math.sin(xw * 2.3 - z * 4.0 + t * 0.37);
      const y = m + wave * (1 - 0.5 * far);
      const nx = ax * 1.06;
      const ny = ((y - 1.15) / zw) * 2.1 - 0.02;
      const light = clamp(m / 2 + (0.35 * Math.max(wave, 0)) / 0.24, 0, 1);
      const fade = (1 - smooth(0.88, 1, z)) * smooth(0, 0.12, z) * (1 - smooth(0.85, 1, Math.abs(ax)));
      const alpha = Math.min(1, fade * (0.4 + 1.4 * light)) * 0.85;
      const px = ((nx + 1) / 2) * W;
      const py = ((1 - ny) / 2) * H;
      if (alpha < 0.04 || px < -4 || px > W + 4 || py < -4 || py > H + 4) continue;
      const size = clamp(9 / zw, 1.4, 3.6) * (0.9 + 0.7 * light) * 0.55;
      const k = light * light * 0.7;
      const col = `rgb(${Math.round(mix(253, 255, k))},${Math.round(mix(96, 199, k))},${Math.round(mix(2, 140, k))})`;
      dots += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(size)}" fill="${col}" fill-opacity="${n(alpha)}"/>`;
    }
  }
  return dots;
}

// Social share images, 1200 x 630: English (og.png) and Dutch (og-nl.png, for
// /nl). The motto over the particle ridge, like the top of the home page.
async function shareImage(lines, address, out) {
  const W = 1200;
  const H = 630;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="sky" cx="0.6" cy="0.85" r="0.75">
      <stop offset="0" stop-color="${ORANGE}" stop-opacity="0.08"/>
      <stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="shade" x1="0" x2="1">
      <stop offset="0" stop-color="${BLACK}" stop-opacity="0.75"/>
      <stop offset="0.55" stop-color="${BLACK}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BLACK}"/>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <g transform="translate(0 70)">${particleRidge(W, H)}</g>
  <rect width="${W}" height="${H}" fill="url(#shade)"/>
  <rect x="0" y="0" width="12" height="${H}" fill="${ORANGE}"/>
  ${text(mono, 'NEVERMADE OUTDOOR CLUB', 76, 92, 24, ORANGE, { tracking: 3 })}
  ${text(barlow, lines[0], 72, 214, 116, ICE)}
  ${text(barlow, lines[1], 72, 320, 116, ICE)}
  ${text(barlow, lines[2], 72, 426, 116, ORANGE)}
  ${text(mono, address, 76, 566, 22, STONE, { tracking: 2 })}
</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(file(out));
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
