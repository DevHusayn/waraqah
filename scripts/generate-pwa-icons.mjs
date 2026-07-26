import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const pwaDir = path.join(root, 'public', 'pwa');
const publicDir = path.join(root, 'public');

const BRAND_GREEN = '#16A34A';
const WHITE = '#FFFFFF';

const fontPath = path.join(
    root,
    'node_modules',
    '@fontsource',
    'bodoni-moda',
    'files',
    'bodoni-moda-latin-600-normal.woff2',
);

const fontBase64 = fs.readFileSync(fontPath).toString('base64');

function buildSvg(size, { maskable = false } = {}) {
    const padding = maskable ? Math.round(size * 0.1) : 0;
    const inner = size - padding * 2;
    const fontSize = Math.round(inner * 0.24);
    const y = padding + inner / 2 + fontSize * 0.34;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>
      @font-face {
        font-family: 'Bodoni Moda';
        font-weight: 600;
        font-style: normal;
        src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
      }
      .wordmark {
        font-family: 'Bodoni Moda', Georgia, serif;
        font-weight: 600;
        font-size: ${fontSize}px;
        fill: ${WHITE};
        letter-spacing: -0.02em;
      }
    </style>
  </defs>
  <rect width="${size}" height="${size}" fill="${BRAND_GREEN}" />
  <text x="${size / 2}" y="${y}" class="wordmark" text-anchor="middle">Waraqah</text>
</svg>`;
}

async function renderIcon(size, outputPath, options = {}) {
    const svg = buildSvg(size, options);
    await sharp(Buffer.from(svg)).png().toFile(outputPath);
    console.log(`Wrote ${path.relative(root, outputPath)}`);
}

async function main() {
    fs.mkdirSync(pwaDir, { recursive: true });

    const sourceSvg = buildSvg(512);
    fs.writeFileSync(path.join(pwaDir, 'icon-source.svg'), sourceSvg, 'utf8');
    console.log('Wrote public/pwa/icon-source.svg');

    await renderIcon(192, path.join(pwaDir, 'icon-192.png'));
    await renderIcon(512, path.join(pwaDir, 'icon-512.png'));
    await renderIcon(512, path.join(pwaDir, 'icon-maskable-512.png'), { maskable: true });
    await renderIcon(180, path.join(pwaDir, 'apple-touch-icon.png'));
    await renderIcon(32, path.join(publicDir, 'favicon-32.png'));
    await renderIcon(16, path.join(publicDir, 'favicon-16.png'));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
