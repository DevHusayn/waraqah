import { BRAND_COLORS, DEFAULT_BRAND_COLOR } from '@waraqah/shared';

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || DEFAULT_BRAND_COLOR);
    if (!result) return { r: 22, g: 163, b: 74 };
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}

function rgbToHex(r, g, b) {
    return `#${[r, g, b].map((c) => Math.min(255, Math.max(0, Math.round(c))).toString(16).padStart(2, '0')).join('')}`;
}

function mixRgb(rgb, target, amount) {
    return {
        r: rgb.r + (target.r - rgb.r) * amount,
        g: rgb.g + (target.g - rgb.g) * amount,
        b: rgb.b + (target.b - rgb.b) * amount,
    };
}

/** Apply brand color as CSS variables on :root */
export function applyBrandTheme(hex) {
    const color = /^#([A-Fa-f0-9]{6})$/.test(hex) ? hex : DEFAULT_BRAND_COLOR;
    const rgb = hexToRgb(color);
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 15, g: 23, b: 42 };

    const root = document.documentElement;
    root.style.setProperty('--brand', color);
    root.style.setProperty('--brand-hover', rgbToHex(...Object.values(mixRgb(rgb, black, 0.14))));
    root.style.setProperty('--brand-light', rgbToHex(...Object.values(mixRgb(rgb, white, 0.92))));
    root.style.setProperty('--brand-subtle', rgbToHex(...Object.values(mixRgb(rgb, white, 0.88))));
    root.style.setProperty('--brand-ring', `${rgb.r} ${rgb.g} ${rgb.b}`);
}

export { DEFAULT_BRAND_COLOR, BRAND_COLORS };
