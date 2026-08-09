import fs from 'node:fs';
import path from 'node:path';
import { assertBrandSources, brandSources, renderBrandIcon, root } from './brand-assets.mjs';

const pwaDir = path.join(root, 'public', 'pwa');
const publicDir = path.join(root, 'public');

/** Solid green canvas + smaller centered W — blends with PWA splash background_color. */
const PWA_ICON_OPTS = {
    background: 'green',
    scale: 0.5,
};

async function main() {
    assertBrandSources();

    if (!fs.existsSync(brandSources.appIcon)) {
        throw new Error('Missing public/brand/waraqah-app-icon.svg');
    }

    fs.mkdirSync(pwaDir, { recursive: true });
    fs.copyFileSync(brandSources.appIcon, path.join(pwaDir, 'icon-source.svg'));
    console.log('Wrote public/pwa/icon-source.svg');

    const iconSource = brandSources.appIcon;

    await renderBrandIcon(iconSource, 192, path.join(pwaDir, 'icon-192.png'), PWA_ICON_OPTS);
    await renderBrandIcon(iconSource, 512, path.join(pwaDir, 'icon-512.png'), PWA_ICON_OPTS);
    await renderBrandIcon(iconSource, 512, path.join(pwaDir, 'icon-maskable-512.png'), {
        ...PWA_ICON_OPTS,
        maskable: true,
        scale: 0.46,
    });
    await renderBrandIcon(iconSource, 180, path.join(pwaDir, 'apple-touch-icon.png'), {
        ...PWA_ICON_OPTS,
        scale: 0.46,
    });

    await renderBrandIcon(brandSources.default, 32, path.join(publicDir, 'favicon-32.png'));
    await renderBrandIcon(brandSources.default, 16, path.join(publicDir, 'favicon-16.png'));
    await renderBrandIcon(iconSource, 512, path.join(publicDir, 'logo-icon.png'), PWA_ICON_OPTS);
    await renderBrandIcon(iconSource, 512, path.join(publicDir, 'logo.png'), PWA_ICON_OPTS);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
