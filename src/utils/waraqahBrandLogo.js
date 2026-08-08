const LOGO_ICON_PATH = '/logo-icon.png';

let cachedLogoDataUrl = null;

/** Load the Waraqah circular icon for PDF footers (cached in-memory and optionally in pngCache). */
export async function loadWaraqahLogoIcon(pngCache) {
    const cacheKey = 'waraqah-brand-icon';
    if (pngCache?.has(cacheKey)) {
        return pngCache.get(cacheKey);
    }
    if (cachedLogoDataUrl) {
        pngCache?.set(cacheKey, cachedLogoDataUrl);
        return cachedLogoDataUrl;
    }

    try {
        const response = await fetch(LOGO_ICON_PATH);
        if (!response.ok) return '';

        const blob = await response.blob();
        const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Could not read logo'));
            reader.readAsDataURL(blob);
        });

        cachedLogoDataUrl = dataUrl;
        pngCache?.set(cacheKey, dataUrl);
        return dataUrl;
    } catch {
        return '';
    }
}
