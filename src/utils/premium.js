/** Premium plan helpers — backend should set businessInfo.plan to "premium" */

import { convertDataUrlToPng } from './imageToPng';

export const PLANS = {
    FREE: 'free',
    PREMIUM: 'premium',
};

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

export function getBusinessInitials(name) {
    const trimmed = (name || '').trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getPlanLabel(businessInfo) {
    return isPremiumUser(businessInfo) ? 'Premium' : 'Free plan';
}

/** True only when the API says plan is premium (source of truth). */
export function isPremiumUser(businessInfo) {
    if (!businessInfo) return false;
    if (businessInfo.plan !== PLANS.PREMIUM && !businessInfo.isPremium) return false;
    if (businessInfo.premiumUntil) {
        return new Date(businessInfo.premiumUntil) > new Date();
    }
    return businessInfo.plan === PLANS.PREMIUM || businessInfo.isPremium === true;
}

export const LOGO_MAX_BYTES = 1.5 * 1024 * 1024;
export const PNG_ACCEPT = 'image/png';
/** Upload picker — JPEG is converted to PNG before save/PDF. */
export const BRAND_IMAGE_ACCEPT = 'image/png,image/jpeg';
/** @deprecated use BRAND_IMAGE_ACCEPT */
export const LOGO_ACCEPT = BRAND_IMAGE_ACCEPT;

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);
const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg'];

function isAcceptedBrandImageFile(file) {
    if (!file) return false;
    if (ACCEPTED_IMAGE_TYPES.has(file.type)) return true;
    const name = (file.name || '').toLowerCase();
    return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
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

/** Accept PNG or JPEG uploads; always returns a PNG data URL (stamp & signature). */
export function readBrandImageAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file selected'));
            return;
        }
        if (!isAcceptedBrandImageFile(file)) {
            reject(new Error('Please upload a PNG or JPEG image'));
            return;
        }
        if (file.size > LOGO_MAX_BYTES) {
            reject(new Error('Image must be smaller than 1.5 MB'));
            return;
        }

        readFileAsDataUrl(file)
            .then(async (dataUrl) => {
                if (!dataUrl.startsWith('data:image/png')) {
                    resolve(await convertDataUrlToPng(dataUrl));
                    return;
                }
                resolve(dataUrl);
            })
            .catch(reject);
    });
}

/**
 * Logo upload: JPEG for sidebar/UI avatar, PNG for PDF rendering.
 * @returns {{ companyLogoUrl: string, companyLogoAvatarUrl: string }}
 */
export async function prepareBrandLogoUpload(file) {
    if (!file) throw new Error('No file selected');
    if (!isAcceptedBrandImageFile(file)) {
        throw new Error('Please upload a PNG or JPEG image');
    }
    if (file.size > LOGO_MAX_BYTES) {
        throw new Error('Image must be smaller than 1.5 MB');
    }

    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl.startsWith('data:image/jpeg')) {
        return {
            companyLogoUrl: await convertDataUrlToPng(dataUrl),
            companyLogoAvatarUrl: dataUrl,
        };
    }
    if (dataUrl.startsWith('data:image/png')) {
        return {
            companyLogoUrl: dataUrl,
            companyLogoAvatarUrl: await convertDataUrlToJpeg(dataUrl),
        };
    }
    throw new Error('Please upload a PNG or JPEG image');
}

/** @deprecated use readBrandImageAsDataUrl */
export function readPngFileAsDataUrl(file) {
    return readBrandImageAsDataUrl(file);
}

/** @deprecated use readBrandImageAsDataUrl */
export function readLogoFileAsDataUrl(file) {
    return readBrandImageAsDataUrl(file);
}
