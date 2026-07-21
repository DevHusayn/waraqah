export const PLANS = {
    FREE: 'free',
    PREMIUM: 'premium',
};

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
    if (!businessInfo) return false;
    if (businessInfo.plan !== PLANS.PREMIUM && !businessInfo.isPremium) return false;
    if (businessInfo.premiumUntil) {
        return new Date(businessInfo.premiumUntil) > new Date();
    }
    return businessInfo.plan === PLANS.PREMIUM || businessInfo.isPremium === true;
}

/** Max upload size for logo, stamp, and signature images. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/** Longest edge (px) after auto-resize on upload. */
export const BRAND_IMAGE_MAX_EDGE = 1200;
