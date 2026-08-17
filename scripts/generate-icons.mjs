/**
 * Generates the PWA icon set from the brand tokens. Pure Node — no image
 * library, so nothing new lands in package.json (CONTEXT.md rule 9).
 *
 *   node scripts/generate-icons.mjs
 *
 * The mark is a padel ball: `ball` on `deep`, with the seam in `court`. The
 * maskable variant shrinks it to survive Android's circular crop.
 */

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");

const DEEP = [0x0a, 0x1f, 0x2c];
const BALL = [0xd3, 0xe0, 0x4b];
const COURT = [0x12, 0x40, 0x5a];

// --- minimal PNG writer ----------------------------------------------------

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([length, typed, crc]);
}

/** `pixels` is RGB triples, row-major, length size*size*3. */
function encodePng(size, pixels) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  // 10..12 stay zero: deflate, adaptive filtering, no interlace

  // One filter byte (0 = none) in front of each scanline.
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 3, (y + 1) * size * 3);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// --- the mark --------------------------------------------------------------

/**
 * Coverage of the ball and its seam at a point, in a 0..1 unit square.
 * `scale` shrinks the ball for the maskable variant.
 */
function shade(u, v, scale) {
  const cx = 0.5;
  const cy = 0.5;
  const r = 0.332 * scale;

  const d = Math.hypot(u - cx, v - cy);
  if (d > r) return null; // outside the ball

  // A real ball seam is one continuous curve, which reads in flat projection
  // as two arcs related by a 180° rotation — one bowing left across the top,
  // its twin bowing right across the bottom. Striking each from a circle
  // centred on the opposite side and offset vertically is what produces that
  // rotational symmetry instead of a symmetrical lens or beach-ball look.
  // Ratios are against the ball radius so everything scales together.
  const dx = 0.62 * r;
  const dy = 0.58 * r;
  const seamR = 1.3 * r;
  const half = 0.035 * r;

  const top = Math.abs(Math.hypot(u - (cx + dx), v - (cy - dy)) - seamR);
  const bottom = Math.abs(Math.hypot(u - (cx - dx), v - (cy + dy)) - seamR);
  const seam = Math.min(top, bottom);

  return seam < half ? COURT : BALL;
}

function render(size, scale) {
  const pixels = Buffer.alloc(size * size * 3);
  const SS = 3; // 3x3 supersampling for edges

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          const c = shade(u, v, scale) ?? DEEP;
          r += c[0];
          g += c[1];
          b += c[2];
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 3;
      pixels[i] = Math.round(r / n);
      pixels[i + 1] = Math.round(g / n);
      pixels[i + 2] = Math.round(b / n);
    }
  }
  return pixels;
}

// --- output ----------------------------------------------------------------

mkdirSync(OUT, { recursive: true });

const targets = [
  { file: "icon-192.png", size: 192, scale: 1 },
  { file: "icon-512.png", size: 512, scale: 1 },
  // Android crops maskable icons to a circle covering the middle 80%.
  { file: "icon-maskable-512.png", size: 512, scale: 0.72 },
  { file: "apple-touch-icon.png", size: 180, scale: 1 },
];

for (const { file, size, scale } of targets) {
  writeFileSync(`${OUT}/${file}`, encodePng(size, render(size, scale)));
  console.log(`wrote public/icons/${file} (${size}px)`);
}

// Also drop a 96px copy in app/ so Next serves it as the favicon.
const appDir = resolve(OUT, "..", "..", "app");
writeFileSync(`${appDir}/icon.png`, encodePng(96, render(96, 1)));
console.log("wrote app/icon.png (96px)");
