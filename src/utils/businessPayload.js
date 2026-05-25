import { PLANS } from './premium';
import { getCompanyLogoUrl } from './brandAssets';

/** Fields the API accepts on PUT /business-info */
export function buildBusinessInfoPayload(formData, businessInfo = {}) {
    const plan = formData.plan ?? businessInfo.plan ?? PLANS.FREE;
    const premium = plan === PLANS.PREMIUM;
    const logo = premium
        ? (formData.companyLogoUrl ??
          formData.businessLogo ??
          getCompanyLogoUrl(businessInfo) ??
          '')
        : '';
    const logoAvatar = premium
        ? (formData.companyLogoAvatarUrl ?? businessInfo.companyLogoAvatarUrl ?? '')
        : '';

    return {
        name: formData.name ?? businessInfo.name ?? '',
        address: formData.address ?? businessInfo.address ?? '',
        email: formData.email ?? businessInfo.email ?? '',
        phone: formData.phone ?? businessInfo.phone ?? '',
        website: formData.website ?? businessInfo.website ?? '',
        taxRate: formData.taxRate ?? businessInfo.taxRate ?? 10,
        brandColor: formData.brandColor ?? businessInfo.brandColor ?? '#0ea5e9',
        defaultCurrency: 'NGN',
        businessLogo: logo,
        companyLogoUrl: logo,
        companyLogoAvatarUrl: logoAvatar,
        companyStampUrl: premium ? (formData.companyStampUrl ?? businessInfo.companyStampUrl ?? '') : '',
        authorizedSignatureUrl: premium
            ? (formData.authorizedSignatureUrl ?? businessInfo.authorizedSignatureUrl ?? '')
            : '',
    };
}

export function canPersistLogoOnServer(businessInfo) {
    return businessInfo?.plan === PLANS.PREMIUM;
}
