import fs from 'node:fs';
import path from 'node:path';
import {
    assertBrandSources,
    brandSources,
    renderAppleTouchSplashIcon,
    renderBrandIcon,
    root,
} from './brand-assets.mjs';

const pwaDir = path.join(root, 'public', 'pwa');
const publicDir = path.join(root, 'public');

async function main() {
    assertBrandSources();

    fs.mkdirSync(pwaDir, { recursive: true });
    fs.copyFileSync(brandSources.default, path.join(pwaDir, 'icon-source.svg'));
    console.log('Wrote public/pwa/icon-source.svg');

    await renderBrandIcon(brandSources.default, 192, path.join(pwaDir, 'icon-192.png'));
    await renderBrandIcon(brandSources.default, 512, path.join(pwaDir, 'icon-512.png'));
    await renderBrandIcon(brandSources.default, 512, path.join(pwaDir, 'icon-maskable-512.png'), {
        maskable: true,
    });
    await renderAppleTouchSplashIcon(
        brandSources.default,
        180,
        path.join(pwaDir, 'apple-touch-icon.png'),
    );
    await renderBrandIcon(brandSources.default, 32, path.join(publicDir, 'favicon-32.png'));
    await renderBrandIcon(brandSources.default, 16, path.join(publicDir, 'favicon-16.png'));
    await renderBrandIcon(brandSources.default, 512, path.join(publicDir, 'logo-icon.png'));
    await renderBrandIcon(brandSources.default, 512, path.join(publicDir, 'logo.png'));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
