import {
    PLANS,
    isPremiumUser,
    getBusinessInitials,
    getPlanLabel,
    LOGO_MAX_BYTES,
    BRAND_IMAGE_MAX_EDGE,
} from '@waraqah/shared';
import { convertDataUrlToPng, convertDataUrlToJpeg } from './imageToPng';

export { PLANS, isPremiumUser, getBusinessInitials, getPlanLabel, LOGO_MAX_BYTES, BRAND_IMAGE_MAX_EDGE };

export const PNG_ACCEPT = 'image/png';
export const BRAND_IMAGE_ACCEPT = 'image/png,image/jpeg,image/svg+xml,.svg';
export const LOGO_ACCEPT = BRAND_IMAGE_ACCEPT;
export const BRAND_IMAGE_HINT = 'PNG (transparent recommended), JPG, or SVG · max 2 MB · auto-resized';

const DEV_PREMIUM_KEY = 'waraqah_premium';

export function isDevPremiumEnabled() {
    return import.meta.env.DEV && localStorage.getItem(DEV_PREMIUM_KEY) === '1';
}

export function setDevPremiumEnabled(enabled) {
    if (!import.meta.env.DEV) return;
    if (enabled) {
        localStorage.setItem(DEV_PREMIUM_KEY, '1');
    } else {
        localStorage.removeItem(DEV_PREMIUM_KEY);
    }
}

const ACCEPTED_IMAGE_TYPES = new Set([
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/svg+xml',
]);
const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg'];

function isAcceptedBrandImageFile(file) {
    if (!file) return false;
    if (ACCEPTED_IMAGE_TYPES.has(file.type)) return true;
    const name = (file.name || '').toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

function isSvgFile(file) {
    if (!file) return false;
    if (file.type === 'image/svg+xml') return true;
    return (file.name || '').toLowerCase().endsWith('.svg');
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Failed to read image file'));
                return;
            }
            resolve(reader.result);
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

function readSvgFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result !== 'string') {
                reject(new Error('Failed to read SVG file'));
                return;
            }
            const svgText = reader.result.trim();
            if (!svgText) {
                reject(new Error('SVG file is empty'));
                return;
            }
            const encoded = encodeURIComponent(svgText)
                .replace(/'/g, '%27')
                .replace(/"/g, '%22');
            resolve(`data:image/svg+xml;charset=utf-8,${encoded}`);
        };
        reader.onerror = () => reject(new Error('Failed to read SVG file'));
        reader.readAsText(file);
    });
}

async function readUploadAsDataUrl(file) {
    if (isSvgFile(file)) {
        return readSvgFileAsDataUrl(file);
    }
    return readFileAsDataUrl(file);
}

function assertBrandImageFile(file) {
    if (!file) {
        throw new Error('No file selected');
    }
    if (!isAcceptedBrandImageFile(file)) {
        throw new Error('Please upload a PNG, JPG, or SVG image');
    }
    if (file.size > LOGO_MAX_BYTES) {
        throw new Error('Image must be smaller than 2 MB');
    }
}

/**
 * Accept PNG, JPEG, or SVG uploads; always returns a resized PNG data URL
 * (stamp & signature). Transparent PNGs are preserved.
 */
export async function readBrandImageAsDataUrl(file) {
    assertBrandImageFile(file);
    const dataUrl = await readUploadAsDataUrl(file);
    return convertDataUrlToPng(dataUrl, BRAND_IMAGE_MAX_EDGE);
}

/**
 * Logo upload: JPEG for sidebar/UI avatar, PNG for PDF rendering.
 * Large images are auto-resized. SVG is rasterized to PNG (+ JPEG avatar).
 * @returns {{ companyLogoUrl: string, companyLogoAvatarUrl: string }}
 */
export async function prepareBrandLogoUpload(file) {
    assertBrandImageFile(file);
    const dataUrl = await readUploadAsDataUrl(file);

    if (isSvgFile(file) || dataUrl.startsWith('data:image/svg+xml')) {
        return {
            companyLogoUrl: await convertDataUrlToPng(dataUrl, BRAND_IMAGE_MAX_EDGE),
            companyLogoAvatarUrl: await convertDataUrlToJpeg(dataUrl, 0.92, BRAND_IMAGE_MAX_EDGE),
        };
    }

    if (dataUrl.startsWith('data:image/jpeg')) {
        return {
            companyLogoUrl: await convertDataUrlToPng(dataUrl, BRAND_IMAGE_MAX_EDGE),
            companyLogoAvatarUrl: await convertDataUrlToJpeg(dataUrl, 0.92, BRAND_IMAGE_MAX_EDGE),
        };
    }

    if (dataUrl.startsWith('data:image/png')) {
        return {
            companyLogoUrl: await convertDataUrlToPng(dataUrl, BRAND_IMAGE_MAX_EDGE),
            companyLogoAvatarUrl: await convertDataUrlToJpeg(dataUrl, 0.92, BRAND_IMAGE_MAX_EDGE),
        };
    }

    throw new Error('Please upload a PNG, JPG, or SVG image');
}

/** @deprecated use readBrandImageAsDataUrl */
export function readPngFileAsDataUrl(file) {
    return readBrandImageAsDataUrl(file);
}

/** @deprecated use readBrandImageAsDataUrl */
export function readLogoFileAsDataUrl(file) {
    return readBrandImageAsDataUrl(file);
}
