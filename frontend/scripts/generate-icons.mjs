// ─── Dwaraka Academy PWA Icon Generator ─────────────────────────────────────
// Generates all required icons from the existing SVG logo.
// Run: node scripts/generate-icons.mjs

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const LOGO_SVG = path.join(PUBLIC_DIR, 'images', 'logo', 'logo.svg');
const LOGO_WHITE_SVG = path.join(PUBLIC_DIR, 'images', 'logo', 'logo-white.svg');

// Brand colors
const BRAND_BLUE = '#1E40AF';
const BRAND_NAVY = '#0F172A';
const WHITE = '#FFFFFF';

// ─── Icon specs ─────────────────────────────────────────────────────────
const ICONS = [
  // { name, size, background, useWhiteLogo, extraPadding }
  { name: 'favicon-16x16.png', size: 16, background: BRAND_BLUE, useWhiteLogo: true, padding: 0.2 },
  { name: 'favicon-32x32.png', size: 32, background: BRAND_BLUE, useWhiteLogo: true, padding: 0.2 },
  { name: 'icon-192.png',      size: 192, background: BRAND_BLUE, useWhiteLogo: true, padding: 0.18 },
  { name: 'icon-512.png',      size: 512, background: BRAND_BLUE, useWhiteLogo: true, padding: 0.18 },
  { name: 'maskable-icon-512.png', size: 512, background: BRAND_BLUE, useWhiteLogo: true, padding: 0.1 },
  { name: 'apple-touch-icon.png', size: 180, background: BRAND_BLUE, useWhiteLogo: true, padding: 0.18 },
  { name: 'mstile-150x150.png', size: 150, background: BRAND_BLUE, useWhiteLogo: true, padding: 0.18 },
];
const FAVICON_SIZES = [16, 32, 48];

// ─── Helpers ────────────────────────────────────────────────────────────

/** Create an ICO file from PNG buffers */
function createIco(pngBuffers) {
  const numImages = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + numImages * dirEntrySize;

  // Header
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);      // Reserved
  header.writeUInt16LE(1, 2);      // Type: ICO
  header.writeUInt16LE(numImages, 4); // Count

  const entries = [];
  const imageData = [];

  for (let i = 0; i < numImages; i++) {
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(dirEntrySize);
    const size = Math.round(Math.sqrt(buf.length)); // approximate, real icons are square

    entry.writeUInt8(size >= 256 ? 0 : size, 0);      // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1);      // Height
    entry.writeUInt8(0, 2);                             // Color palette (0 = none)
    entry.writeUInt8(0, 3);                             // Reserved
    entry.writeUInt16LE(1, 4);                          // Color planes
    entry.writeUInt16LE(32, 6);                         // Bits per pixel
    entry.writeUInt32LE(buf.length, 8);                 // Image size
    entry.writeUInt32LE(offset, 12);                    // Image offset

    entries.push(entry);
    imageData.push(buf);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...imageData]);
}

// ─── Main ───────────────────────────────────────────────────────────────

async function generate() {
  console.log('🔧 Dwaraka Academy — PWA Icon Generator\n');
  console.log(`📂 Output: ${PUBLIC_DIR}\n`);

  // Check source file
  if (!fs.existsSync(LOGO_SVG)) {
    console.error('❌ Logo SVG not found at:', LOGO_SVG);
    process.exit(1);
  }
  if (!fs.existsSync(LOGO_WHITE_SVG)) {
    console.error('❌ White logo SVG not found at:', LOGO_WHITE_SVG);
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(LOGO_SVG);
  const whiteSvgBuffer = fs.readFileSync(LOGO_WHITE_SVG);

  const generated = [];

  for (const icon of ICONS) {
    const { name, size, background, useWhiteLogo, padding } = icon;
    const srcSvg = useWhiteLogo ? whiteSvgBuffer : svgBuffer;

    // Calculate logo dimensions: maintain aspect ratio, add padding
    // SVG viewBox is 600x331, need to fit within the square with padding
    const logoAspect = 600 / 331; // ~1.81
    const paddedSize = size * (1 - padding * 2);
    let logoW, logoH;

    if (logoAspect > 1) {
      // Logo is wider than tall — fit by width
      logoW = paddedSize;
      logoH = paddedSize / logoAspect;
    } else {
      logoH = paddedSize;
      logoW = paddedSize * logoAspect;
    }

    // Center position
    const left = Math.round((size - logoW) / 2);
    const top = Math.round((size - logoH) / 2);

    // Create composite: background color + logo
    const outputPath = path.join(PUBLIC_DIR, name);

    // Create a solid background
    const bg = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: background,
      },
    })
      .raw()
      .toBuffer();

    // Get the SVG rendered at the correct size
    const logo = await sharp(srcSvg)
      .resize(Math.round(logoW), Math.round(logoH), { fit: 'fill', kernel: 'lanczos3' })
      .ensureAlpha()
      .raw()
      .toBuffer();

    // Composite: place logo on background
    const compositeImage = Buffer.alloc(size * size * 4, 0);

    // Fill background
    const [r, g, b] = hexToRgb(background);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        compositeImage[idx] = r;
        compositeImage[idx + 1] = g;
        compositeImage[idx + 2] = b;
        compositeImage[idx + 3] = 255;
      }
    }

    // Composite logo on top
    for (let ly = 0; ly < Math.round(logoH); ly++) {
      for (let lx = 0; lx < Math.round(logoW); lx++) {
        const sx = left + lx;
        const sy = top + ly;
        if (sx >= 0 && sx < size && sy >= 0 && sy < size) {
          const logoIdx = (ly * Math.round(logoW) + lx) * 4;
          const imgIdx = (sy * size + sx) * 4;

          // White logo: use luminosity as alpha
          const logoAlpha = useWhiteLogo ? logo[logoIdx + 3] : logo[logoIdx + 3];
          const logoColor = useWhiteLogo ? 255 : logo[logoIdx];

          if (logoAlpha > 0) {
            const alpha = logoAlpha / 255;
            compositeImage[imgIdx] = Math.round(compositeImage[imgIdx] * (1 - alpha) + 255 * alpha);
            compositeImage[imgIdx + 1] = Math.round(compositeImage[imgIdx + 1] * (1 - alpha) + 255 * alpha);
            compositeImage[imgIdx + 2] = Math.round(compositeImage[imgIdx + 2] * (1 - alpha) + 255 * alpha);
            compositeImage[imgIdx + 3] = 255;
          }
        }
      }
    }

    // Write PNG
    const finalPng = await sharp(compositeImage, {
      raw: { width: size, height: size, channels: 4 },
    })
      .png()
      .toBuffer();

    fs.writeFileSync(outputPath, finalPng);
    generated.push({ name, size: `${size}x${size}`, file: outputPath });
    console.log(`  ✅ ${name.padEnd(25)} ${size}x${size}`);
  }

  // ── Generate favicon.ico (multi-size) ──
  console.log('');
  const icoPngs = [];
  for (const size of FAVICON_SIZES) {
    const paddedSize = size * (1 - 0.2 * 2);
    const logoAspect = 600 / 331;
    let logoW = paddedSize;
    let logoH = paddedSize / logoAspect;
    const left = Math.round((size - logoW) / 2);
    const top = Math.round((size - logoH) / 2);

    const bg = await sharp({
      create: { width: size, height: size, channels: 4, background: BRAND_BLUE },
    }).raw().toBuffer();

    const logo = await sharp(whiteSvgBuffer)
      .resize(Math.round(logoW), Math.round(logoH), { fit: 'fill', kernel: 'lanczos3' })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const compositeImage = Buffer.alloc(size * size * 4, 0);
    const [r, g, b] = hexToRgb(BRAND_BLUE);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;
        compositeImage[idx] = r;
        compositeImage[idx + 1] = g;
        compositeImage[idx + 2] = b;
        compositeImage[idx + 3] = 255;
      }
    }
    for (let ly = 0; ly < Math.round(logoH); ly++) {
      for (let lx = 0; lx < Math.round(logoW); lx++) {
        const sx = left + lx;
        const sy = top + ly;
        if (sx >= 0 && sx < size && sy >= 0 && sy < size) {
          const logoIdx = (ly * Math.round(logoW) + lx) * 4;
          const imgIdx = (sy * size + sx) * 4;
          const alpha = logo[logoIdx + 3] / 255;
          if (alpha > 0) {
            compositeImage[imgIdx] = Math.round(compositeImage[imgIdx] * (1 - alpha) + 255 * alpha);
            compositeImage[imgIdx + 1] = Math.round(compositeImage[imgIdx + 1] * (1 - alpha) + 255 * alpha);
            compositeImage[imgIdx + 2] = Math.round(compositeImage[imgIdx + 2] * (1 - alpha) + 255 * alpha);
            compositeImage[imgIdx + 3] = 255;
          }
        }
      }
    }

    const pngBuf = await sharp(compositeImage, {
      raw: { width: size, height: size, channels: 4 },
    }).png().toBuffer();

    icoPngs.push(pngBuf);
  }

  const icoBuffer = createIco(icoPngs);
  const icoPath = path.join(PUBLIC_DIR, 'favicon.ico');
  fs.writeFileSync(icoPath, icoBuffer);
  console.log(`  ✅ favicon.ico                  multi (${FAVICON_SIZES.join(', ')})`);
  generated.push({ name: 'favicon.ico', size: `${FAVICON_SIZES.join('x')}+`, file: icoPath });

  // ── Summary ──
  console.log(`\n📊 Generated ${generated.length} icon files successfully.`);

  // Verify files exist and show sizes
  let totalSize = 0;
  for (const g of generated) {
    const stats = fs.statSync(g.file);
    totalSize += stats.size;
    console.log(`  📄 ${g.name.padEnd(25)} ${(stats.size / 1024).toFixed(1)} KB`);
  }
  console.log(`\n📦 Total icon size: ${(totalSize / 1024).toFixed(1)} KB`);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

generate().catch((err) => {
  console.error('❌ Error generating icons:', err);
  process.exit(1);
});
