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
const PROFILE_FIELDS = ['name', 'address', 'email', 'phone', 'website'];

function isSparseProfile(info) {
    return !String(info?.name || '').trim() && !String(info?.email || '').trim();
}

function keepFilled(next, prev, incoming, fields) {
    for (const field of fields) {
        const incomingVal = String(incoming[field] || '').trim();
        const existingVal = String(prev[field] || '').trim();
        if (!incomingVal && existingVal) {
            next[field] = prev[field];
        }
    }
}

/** Keep cached brand assets when a summary payload omits heavy fields. */
export function mergeBusinessInfoSummary(prev, incoming) {
    if (!incoming) return prev ?? {};
    if (!prev) return incoming;

    const next = { ...incoming };

    if (isSparseProfile(incoming) && !isSparseProfile(prev)) {
        keepFilled(next, prev, incoming, [
            ...PROFILE_FIELDS,
            'timezone',
            'country',
            'defaultCurrency',
        ]);
    }

    if (!isPremiumUser(incoming)) {
        return next;
    }

    keepFilled(next, prev, incoming, SUMMARY_ASSET_FIELDS);
    return next;
}
