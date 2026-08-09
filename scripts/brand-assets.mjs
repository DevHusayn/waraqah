import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const root = path.join(__dirname, '..');
export const brandDir = path.join(root, 'public', 'brand');

/** Master vector assets — used in web UI and as source for raster icons. */
export const brandSources = {
    default: path.join(brandDir, 'waraqah-logo.svg'),
    light: path.join(brandDir, 'waraqah-logo-light.svg'),
    appIcon: path.join(brandDir, 'waraqah-app-icon.svg'),
};

const BRAND_GREEN = { r: 22, g: 163, b: 74, alpha: 1 };

export function assertBrandSources() {
    if (!fs.existsSync(brandSources.default) || !fs.existsSync(brandSources.light)) {
        throw new Error('Missing brand SVG sources in public/brand/');
    }
}

/**
 * Rasterize a brand SVG to PNG.
 * @param {'transparent'|'green'} options.background - green fills the canvas so PWA splash matches theme_color
 * @param {number} options.scale - icon size relative to canvas (lower = smaller on splash)
 */
export async function renderBrandIcon(sourcePath, size, outputPath, options = {}) {
    const {
        maskable = false,
        background = 'transparent',
        scale = maskable ? 0.5 : 0.88,
    } = options;

    const innerSize = Math.round(size * scale);
    const padding = Math.round((size - innerSize) / 2);

    const icon = await sharp(sourcePath).resize(innerSize, innerSize).png().toBuffer();

    const canvasBackground = background === 'green' ? BRAND_GREEN : { r: 0, g: 0, b: 0, alpha: 0 };

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: canvasBackground,
        },
    })
        .composite([{ input: icon, top: padding, left: padding }])
        .png()
        .toFile(outputPath);

    console.log(`Wrote ${path.relative(root, outputPath)}`);
}

export async function renderMonochromeIcon(sourcePath, size, outputPath) {
    const { data, info } = await sharp(sourcePath)
        .resize(size, size)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const out = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += 4) {
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const alpha = lum > 90 ? 255 : 0;
        out[i] = 255;
        out[i + 1] = 255;
        out[i + 2] = 255;
        out[i + 3] = alpha;
    }

    await sharp(out, {
        raw: { width: info.width, height: info.height, channels: 4 },
    })
        .png()
        .toFile(outputPath);

    console.log(`Wrote ${path.relative(root, outputPath)}`);
}
