import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assetsDir = path.join(root, 'apps', 'mobile', 'assets');

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

function buildSvg(size, { maskable = false, monochrome = false } = {}) {
    const padding = maskable ? Math.round(size * 0.1) : 0;
    const inner = size - padding * 2;
    const fontSize = Math.round(inner * 0.48);
    const y = padding + inner / 2 + fontSize * 0.34;

    const background = monochrome
        ? ''
        : `<rect width="${size}" height="${size}" fill="${BRAND_GREEN}" />`;

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>
      @font-face {
        font-family: 'Bodoni Moda';
        font-weight: 600;
        font-style: normal;
        src: url(data:font/woff2;base64,${fontBase64}) format('woff2');
      }
      .letter {
        font-family: 'Bodoni Moda', Georgia, serif;
        font-weight: 600;
        font-size: ${fontSize}px;
        fill: ${WHITE};
        letter-spacing: -0.02em;
      }
    </style>
  </defs>
  ${background}
  <text x="${size / 2}" y="${y}" class="letter" text-anchor="middle">W</text>
</svg>`;
}

async function renderIcon(size, outputPath, options = {}) {
    const svg = buildSvg(size, options);
    await sharp(Buffer.from(svg)).png().toFile(outputPath);
    console.log(`Wrote ${path.relative(root, outputPath)}`);
}

async function main() {
    fs.mkdirSync(assetsDir, { recursive: true });

    await renderIcon(1024, path.join(assetsDir, 'icon.png'));
    await renderIcon(512, path.join(assetsDir, 'splash-icon.png'));
    await renderIcon(432, path.join(assetsDir, 'android-icon-foreground.png'), { maskable: true });
    await renderIcon(432, path.join(assetsDir, 'android-icon-monochrome.png'), { monochrome: true });
    await renderIcon(48, path.join(assetsDir, 'favicon.png'));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
