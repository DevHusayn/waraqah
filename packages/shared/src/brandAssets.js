import { isPremiumUser } from './premium.js';

export function getCompanyLogoUrl(businessInfo) {
    if (!businessInfo) return '';
    return (businessInfo.companyLogoUrl || businessInfo.businessLogo || '').trim();
}

export function getCompanyLogoAvatarUrl(businessInfo) {
    if (!businessInfo) return '';
    const avatar = (businessInfo.companyLogoAvatarUrl || '').trim();
    if (avatar) return avatar;
    return getCompanyLogoUrl(businessInfo);
}

export function getCompanyStampUrl(businessInfo) {
    if (!businessInfo) return '';
    return (businessInfo.companyStampUrl || '').trim();
}

export function getAuthorizedSignatureUrl(businessInfo) {
    if (!businessInfo) return '';
    return (businessInfo.authorizedSignatureUrl || '').trim();
}

export const BRAND_ASSET_FIELDS = [
    'companyLogoUrl',
    'companyLogoAvatarUrl',
    'companyStampUrl',
    'authorizedSignatureUrl',
];

const SUMMARY_ASSET_FIELDS = ['businessLogo', ...BRAND_ASSET_FIELDS];

/** Keep cached brand assets when a summary payload omits heavy fields. */
export function mergeBusinessInfoSummary(prev, incoming) {
    if (!incoming) return prev ?? {};
    if (!prev) return incoming;
    if (!isPremiumUser(incoming)) {
        return incoming;
    }
    const next = { ...incoming };
    for (const field of SUMMARY_ASSET_FIELDS) {
        const incomingVal = (incoming[field] || '').trim();
        const existingVal = (prev[field] || '').trim();
        if (!incomingVal && existingVal) {
            next[field] = prev[field];
        }
    }
    return next;
}
