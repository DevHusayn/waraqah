import { APP_CURRENCY } from './currency';
import { PLANS } from './premium';

/** Fields the API accepts on PUT /business-info */
export function buildBusinessInfoPayload(formData, businessInfo = {}) {
    const plan = formData.plan ?? businessInfo.plan ?? PLANS.FREE;
    const premium = plan === PLANS.PREMIUM;

    return {
        name: formData.name ?? businessInfo.name ?? '',
        address: formData.address ?? businessInfo.address ?? '',
        email: formData.email ?? businessInfo.email ?? '',
        phone: formData.phone ?? businessInfo.phone ?? '',
        website: formData.website ?? businessInfo.website ?? '',
        taxRate: formData.taxRate ?? businessInfo.taxRate ?? 10,
        brandColor: formData.brandColor ?? businessInfo.brandColor ?? '#0ea5e9',
        defaultCurrency: APP_CURRENCY,
        businessLogo: premium ? (formData.businessLogo ?? businessInfo.businessLogo ?? '') : '',
    };
}

export function canPersistLogoOnServer(businessInfo) {
    return businessInfo?.plan === PLANS.PREMIUM;
}
