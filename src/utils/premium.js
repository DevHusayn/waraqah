/** Premium plan helpers — backend should set businessInfo.plan to "premium" */

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

export function isPremiumUser(businessInfo) {
    if (isDevPremiumEnabled()) return true;
    if (!businessInfo) return false;
    if (businessInfo.plan === PLANS.PREMIUM || businessInfo.isPremium === true) {
        return true;
    }
    if (import.meta.env.DEV && localStorage.getItem('waraqah_plan') === 'premium') {
        return true;
    }
    return false;
}

export const LOGO_MAX_BYTES = 1.5 * 1024 * 1024;
export const LOGO_ACCEPT = 'image/png,image/jpeg,image/jpg,image/webp';

export function readLogoFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file selected'));
            return;
        }
        if (!file.type.startsWith('image/')) {
            reject(new Error('Please upload a PNG, JPG, or WebP image'));
            return;
        }
        if (file.size > LOGO_MAX_BYTES) {
            reject(new Error('Logo must be smaller than 1.5 MB'));
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}
