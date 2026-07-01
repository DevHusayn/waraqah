import { getCompanyLogoUrl } from './brandAssets.js';
import { PLANS } from './premium.js';

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
        brandColor: formData.brandColor ?? businessInfo.brandColor ?? '#16A34A',
        defaultCurrency: 'NGN',
        businessLogo: logo,
        companyLogoUrl: logo,
        companyLogoAvatarUrl: logoAvatar,
        companyStampUrl: premium ? (formData.companyStampUrl ?? businessInfo.companyStampUrl ?? '') : '',
        authorizedSignatureUrl: premium
            ? (formData.authorizedSignatureUrl ?? businessInfo.authorizedSignatureUrl ?? '')
            : '',
        paymentAccountName: formData.paymentAccountName ?? businessInfo.paymentAccountName ?? '',
        paymentBankName: formData.paymentBankName ?? businessInfo.paymentBankName ?? '',
        paymentAccountNumber: formData.paymentAccountNumber ?? businessInfo.paymentAccountNumber ?? '',
        paymentInstructions: formData.paymentInstructions ?? businessInfo.paymentInstructions ?? '',
        autoEmailInvoices: formData.autoEmailInvoices ?? businessInfo.autoEmailInvoices ?? false,
    };
}

export function canPersistLogoOnServer(businessInfo) {
    return businessInfo?.plan === PLANS.PREMIUM;
}
