/** Resolve premium brand asset URLs stored in MongoDB. */

export function getCompanyLogoUrl(businessInfo) {
    if (!businessInfo) return '';
    return (businessInfo.companyLogoUrl || businessInfo.businessLogo || '').trim();
}

/** JPEG avatar for sidebar and in-app UI; falls back to PNG for legacy records. */
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
