import { APP_SOCIAL_LINKS, BRAND_COLORS, DEFAULT_BRAND_COLOR, getAppDomain } from '@waraqah/shared';

export const APP_NAME = 'Waraqah';
export const APP_WEBSITE_URL = (process.env.EXPO_PUBLIC_APP_URL || 'https://mywaraqah.com')
    .trim()
    .replace(/\/$/, '');
export const APP_DOMAIN = getAppDomain(APP_WEBSITE_URL);
export const APP_TAGLINE = 'Quote. Invoice. Get Paid.';
export const APP_VERSION = '1.0.0';
export const APP_SUPPORT_EMAIL = 'support@mywaraqah.com';
export const APP_DESCRIPTION =
    'Waraqah helps freelancers and businesses create quotations and invoices in seconds, manage clients and products, mark payments, and export professional PDFs.';

export { APP_SOCIAL_LINKS, BRAND_COLORS, DEFAULT_BRAND_COLOR };
