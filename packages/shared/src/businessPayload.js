import { PLANS } from './premium.js';

const SCALAR_FIELDS = [
    'name',
    'address',
    'email',
    'phone',
    'website',
    'taxRate',
    'brandColor',
    'defaultCurrency',
    'invoiceTemplateId',
    'paymentAccountName',
    'paymentBankName',
    'paymentAccountNumber',
    'paymentInstructions',
    'autoEmailInvoices',
    'plan',
];

const ASSET_FIELDS = [
    'businessLogo',
    'companyLogoUrl',
    'companyLogoAvatarUrl',
    'companyStampUrl',
    'authorizedSignatureUrl',
];

function hasOwn(formData, key) {
    return Object.prototype.hasOwnProperty.call(formData, key);
}

export function buildBusinessInfoPayload(formData, businessInfo = {}) {
    const plan = hasOwn(formData, 'plan') ? formData.plan : (businessInfo.plan ?? PLANS.FREE);
    const premium = plan === PLANS.PREMIUM;
    const payload = {};

    for (const key of SCALAR_FIELDS) {
        if (hasOwn(formData, key)) {
            payload[key] = formData[key];
        }
    }

    if (hasOwn(formData, 'defaultCurrency') && payload.defaultCurrency == null) {
        payload.defaultCurrency = 'NGN';
    }

    const hasAssetUpdate = ASSET_FIELDS.some((key) => hasOwn(formData, key));
    if (!hasAssetUpdate) {
        return payload;
    }

    if (!premium) {
        for (const key of ASSET_FIELDS) {
            if (hasOwn(formData, key)) {
                payload[key] = '';
            }
        }
        return payload;
    }

    if (hasOwn(formData, 'companyLogoUrl') || hasOwn(formData, 'businessLogo')) {
        const logo = formData.companyLogoUrl ?? formData.businessLogo ?? '';
        payload.companyLogoUrl = logo;
        payload.businessLogo = logo;
    }

    if (hasOwn(formData, 'companyLogoAvatarUrl')) {
        payload.companyLogoAvatarUrl = formData.companyLogoAvatarUrl;
    }
    if (hasOwn(formData, 'companyStampUrl')) {
        payload.companyStampUrl = formData.companyStampUrl;
    }
    if (hasOwn(formData, 'authorizedSignatureUrl')) {
        payload.authorizedSignatureUrl = formData.authorizedSignatureUrl;
    }

    return payload;
}

export function canPersistLogoOnServer(businessInfo) {
    return businessInfo?.plan === PLANS.PREMIUM;
}
