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
};

const BRAND_GREEN = { r: 22, g: 163, b: 74, alpha: 1 };

export function assertBrandSources() {
    if (!fs.existsSync(brandSources.default) || !fs.existsSync(brandSources.light)) {
        throw new Error('Missing brand SVG sources in public/brand/');
    }
}

export async function renderBrandIcon(sourcePath, size, outputPath, { maskable = false } = {}) {
    const innerSize = maskable ? Math.round(size * 0.82) : size;
    const padding = maskable ? Math.round((size - innerSize) / 2) : 0;

    const icon = await sharp(sourcePath).resize(innerSize, innerSize).png().toBuffer();

    if (maskable) {
        await sharp({
            create: {
                width: size,
                height: size,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite([{ input: icon, top: padding, left: padding }])
            .png()
            .toFile(outputPath);
    } else {
        await sharp(icon).toFile(outputPath);
    }

    console.log(`Wrote ${path.relative(root, outputPath)}`);
}

/** iOS PWA splash only — full-size logo on brand-green (no transparent corners). */
export async function renderAppleTouchSplashIcon(sourcePath, size, outputPath) {
    const icon = await sharp(sourcePath).resize(size, size).png().toBuffer();

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: BRAND_GREEN,
        },
    })
        .composite([{ input: icon, top: 0, left: 0 }])
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
