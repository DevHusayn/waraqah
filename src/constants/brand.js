import { BRAND_COLORS, DEFAULT_BRAND_COLOR, getAppDomain } from '@waraqah/shared';

export const APP_NAME = 'Waraqah';
export const APP_WEBSITE_URL = (import.meta.env.VITE_APP_URL || 'https://mywaraqah.com')
    .trim()
    .replace(/\/$/, '');
export const APP_DOMAIN = getAppDomain(APP_WEBSITE_URL);
export const APP_TAGLINE = 'Invoice. Get Paid. Grow.';
export const APP_TITLE = `${APP_NAME} — ${APP_TAGLINE}`;
export const APP_VERSION = '1.0.0';
export const APP_SUPPORT_EMAIL = 'support@mywaraqah.com';
export const APP_DESCRIPTION =
    'Waraqah helps freelancers and businesses create invoices in seconds, email clients with invoices and receipts, manage payments, and export professional PDFs in NGN.';

export { BRAND_COLORS, DEFAULT_BRAND_COLOR };
