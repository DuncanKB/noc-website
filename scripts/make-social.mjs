// Instagram graphics for the waitlist, in the site's look: the motto, a phone
// with the real app screens (public/app/, from `npm run screens`) and the
// address. Writes marketing/instagram/ (not part of the website):
//   story-<lang>.png  1080 x 1920  (keep the bottom free for the link sticker)
//   post-<lang>.png   1080 x 1350  (4:5, the tallest feed size)
// Run with `npm run social`.
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import opentype from 'opentype.js';

const ORANGE = '#FD6002';
const PAGE = '#191C1D';
const ICE = '#F5EEE9';
const STONE = '#AAA49F';

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

// Text as SVG paths (no installed fonts needed). Returns the markup and its width.
function text(f, str, x, y, size, fill, { anchor = 'start', tracking = 0 } = {}) {
  const glyphs = f.stringToGlyphs(str);
  const scale = size / f.unitsPerEm;
  let width = -tracking;
  for (const g of glyphs) width += g.advanceWidth * scale + tracking;
  let cx = anchor === 'middle' ? x - width / 2 : x;
  let d = '';
  for (const g of glyphs) {
    d += `<path d="${pathData(g.getPath(cx, y, size))}" fill="${fill}"/>`;
    cx += g.advanceWidth * scale + tracking;
  }
  return d;
}

// Width of a line of text, to place things after it.
function measure(f, str, size, tracking = 0) {
  const scale = size / f.unitsPerEm;
  return f.stringToGlyphs(str).reduce((w, g) => w + g.advanceWidth * scale + tracking, -tracking);
}

// An arrow (the brand fonts have none), drawn after the call to action.
const arrow = (x, y, size, color) => {
  const h = size * 0.34, w = size * 0.62, t = size * 0.11;
  return `<path d="M${x} ${y - h}H${x + w}M${x + w - h * 0.9} ${y - h * 1.9}L${x + w} ${y - h}L${x + w - h * 0.9} ${y - h * 0.1}" fill="none" stroke="${color}" stroke-width="${t}" stroke-linecap="square"/>`;
};

// The phone: status bar + Home screen + tab bar, in a dark bezel, at `width` px.
async function phone(width, screen = '1-home') {
  const parts = [
    { input: file('public/app/statusbar.webp'), top: 0, left: 0 },
    { input: file(`public/app/${screen}.webp`), top: 108, left: 0 },
    { input: file(`public/app/tab-${screen}.webp`), top: 108 + 1512, left: 0 },
  ];
  const W = 828, H = 108 + 1512 + 178, R = 96;
  const shot = await sharp({ create: { width: W, height: H, channels: 4, background: PAGE } })
    .composite(parts)
    .png()
    .toBuffer();
  const mask = Buffer.from(`<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" rx="${R}" fill="#fff"/></svg>`);
  const rounded = await sharp(shot).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  const B = 26; // bezel
  const bezel = Buffer.from(
    `<svg width="${W + 2 * B}" height="${H + 2 * B}"><rect x="1.5" y="1.5" width="${W + 2 * B - 3}" height="${H + 2 * B - 3}" rx="${R + B}" fill="#0d0f10" stroke="#3a4144" stroke-width="3"/></svg>`,
  );
  const framed = await sharp(bezel).composite([{ input: rounded, top: B, left: B }]).png().toBuffer();
  return sharp(framed).resize({ width }).png().toBuffer();
}

const COPY = {
  en: {
    lines: ['DO THE THINGS', 'YOU HAVEN’T', 'DONE YET.'],
    cta: 'GET THE APP FIRST',
    address: 'NEVERMADEOUTDOORCLUB.COM',
  },
  nl: {
    lines: ['DOE WAT JE', 'NOG NOOIT', 'HEBT GEDAAN.'],
    cta: 'KRIJG DE APP ALS EERSTE',
    address: 'NEVERMADEOUTDOORCLUB.COM/NL',
  },
};

// A soft sunrise glow behind the phone.
const glow = (w, h, cx, cy, r) =>
  `<defs><radialGradient id="g" cx="${cx}" cy="${cy}" r="${r}" gradientUnits="userSpaceOnUse">
     <stop offset="0" stop-color="${ORANGE}" stop-opacity="0.32"/>
     <stop offset="1" stop-color="${ORANGE}" stop-opacity="0"/>
   </radialGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/>`;

async function make(kind, lang) {
  const c = COPY[lang];
  const W = 1080;
  const H = kind === 'story' ? 1920 : 1350;
  const s = kind === 'story'
    ? { label: 250, size: 150, line: 138, first: 420, cta: 900, phoneTop: 1000, phoneW: 700 }
    : { label: 120, size: 118, line: 108, first: 250, cta: 570, phoneTop: 640, phoneW: 540 };
  const x = 80;
  const head = c.lines
    .map((l, i) => text(barlow, l, x - 4, s.first + i * s.line, s.size, i === 2 ? ORANGE : ICE))
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect width="${W}" height="${H}" fill="${PAGE}"/>
    ${glow(W, H, W / 2, s.phoneTop + 380, 620)}
    <rect x="0" y="0" width="12" height="${H}" fill="${ORANGE}"/>
    ${text(mono, 'NEVERMADE OUTDOOR CLUB', x, s.label, 30, ORANGE, { tracking: 4 })}
    ${head}
    ${text(barlow, c.cta, x, s.cta, 58, ICE, { tracking: 1 })}
    ${arrow(x + measure(barlow, c.cta, 58, 1) + 22, s.cta, 58, ORANGE)}
    ${text(mono, c.address, x, s.cta + 52, 28, STONE, { tracking: 3 })}
  </svg>`;
  const device = await phone(s.phoneW);
  const { height: ph } = await sharp(device).metadata();
  // The phone runs off the bottom edge; crop what doesn't fit.
  const visible = Math.min(ph, H - s.phoneTop);
  const cropped = await sharp(device).extract({ left: 0, top: 0, width: s.phoneW, height: visible }).toBuffer();
  const out = `marketing/instagram/${kind}-${lang}.png`;
  await sharp(Buffer.from(svg))
    .composite([{ input: cropped, top: s.phoneTop, left: W - s.phoneW - (kind === 'story' ? 60 : 110) }])
    .png()
    .toFile(file(out));
  console.log(out);
}

mkdirSync(file('marketing/instagram'), { recursive: true });
for (const kind of ['story', 'post']) for (const lang of ['en', 'nl']) await make(kind, lang);
