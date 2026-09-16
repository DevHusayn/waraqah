import { DEFAULT_COUNTRY, normalizeCountry } from './country.js';

/** ISO 3166-1 alpha-2 → ITU calling code (no +). Practical set for businessInfo.country. */
export const COUNTRY_CALLING_CODES = {
    AE: '971', AU: '61', BR: '55', CA: '1', CI: '225', CM: '237', CN: '86',
    DE: '49', EG: '20', ES: '34', ET: '251', FR: '33', GB: '44', GH: '233',
    IN: '91', KE: '254', NG: '234', NL: '31', RW: '250', SA: '966', SN: '221',
    TZ: '255', UG: '256', US: '1', ZA: '27', ZM: '260', ZW: '263',
};

const DEFAULT_CALLING_CODE = COUNTRY_CALLING_CODES[DEFAULT_COUNTRY] || '234';

export function getCallingCode(country) {
    const code = normalizeCountry(country);
    return COUNTRY_CALLING_CODES[code] || DEFAULT_CALLING_CODE;
}

export function buildAdminWhatsAppOnboardingMessage(businessName) {
    const name = String(businessName || '').trim();
    const greeting = name ? `Hi ${name},` : 'Hi,';
    return `${greeting}

We noticed that you recently registered on Waraqah. We'd love to help you set up your business properly and show you how to get the best out of Waraqah.

If you don't mind sparing a few minutes, we'd be happy to guide you through the setup so you can start using Waraqah for your business today.

Looking forward to helping you get started.

Team Waraqah`;
}

/**
 * Build a WhatsApp chat URL from a free-text phone number.
 * Returns null when the value cannot be turned into a wa.me link.
 */
export function toWhatsAppUrl(phone, country, message) {
    const raw = String(phone || '').trim();
    if (!raw) return null;

    const hadPlus = raw.startsWith('+');
    let digits = raw.replace(/\D/g, '');
    if (!digits) return null;

    const internationalPrefix = hadPlus || digits.startsWith('00');
    if (digits.startsWith('00')) {
        digits = digits.slice(2);
    }
    if (!digits) return null;

    if (!internationalPrefix && digits.startsWith('0')) {
        digits = `${getCallingCode(country)}${digits.slice(1)}`;
    }

    if (digits.length < 8 || digits.length > 15) return null;

    const url = `https://wa.me/${digits}`;
    const text = String(message || '').trim();
    if (!text) return url;
    return `${url}?text=${encodeURIComponent(text)}`;
}
