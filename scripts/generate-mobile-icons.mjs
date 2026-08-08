import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {
    assertBrandSources,
    brandSources,
    renderBrandIcon,
    renderMonochromeIcon,
    root,
} from './brand-assets.mjs';

const assetsDir = path.join(root, 'apps', 'mobile', 'assets');
const brandDir = path.join(assetsDir, 'brand');
const BRAND_GREEN = '#16A34A';

async function renderSolidBackground(size, color, outputPath) {
    await sharp({
        create: {
            width: size,
            height: size,
            channels: 4,
            background: color,
        },
    })
        .png()
        .toFile(outputPath);

    console.log(`Wrote ${path.relative(root, outputPath)}`);
}

async function main() {
    assertBrandSources();

    fs.mkdirSync(brandDir, { recursive: true });
    fs.copyFileSync(brandSources.default, path.join(brandDir, 'waraqah-logo.svg'));
    fs.copyFileSync(brandSources.light, path.join(brandDir, 'waraqah-logo-light.svg'));

    await renderBrandIcon(brandSources.default, 1024, path.join(assetsDir, 'icon.png'));
    await renderBrandIcon(brandSources.default, 512, path.join(assetsDir, 'splash-icon.png'));
    await renderBrandIcon(brandSources.default, 432, path.join(assetsDir, 'android-icon-foreground.png'), {
        maskable: true,
    });
    await renderMonochromeIcon(brandSources.default, 432, path.join(assetsDir, 'android-icon-monochrome.png'));
    await renderSolidBackground(432, BRAND_GREEN, path.join(assetsDir, 'android-icon-background.png'));
    await renderBrandIcon(brandSources.default, 48, path.join(assetsDir, 'favicon.png'));
    await renderBrandIcon(brandSources.default, 192, path.join(brandDir, 'logo-icon.png'));
    await renderBrandIcon(brandSources.light, 192, path.join(brandDir, 'logo-icon-light.png'));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
