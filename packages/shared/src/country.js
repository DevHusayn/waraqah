import { APP_CURRENCY, normalizeCurrency } from './currency.js';

export const DEFAULT_COUNTRY = 'NG';

/** ISO 3166-1 alpha-2 → ISO 4217. */
export const COUNTRY_CURRENCY = {
    AD: 'EUR', AE: 'AED', AF: 'AFN', AG: 'XCD', AI: 'XCD', AL: 'ALL', AM: 'AMD',
    AO: 'AOA', AR: 'ARS', AS: 'USD', AT: 'EUR', AU: 'AUD', AW: 'AWG', AX: 'EUR',
    AZ: 'AZN', BA: 'BAM', BB: 'BBD', BD: 'BDT', BE: 'EUR', BF: 'XOF', BG: 'BGN',
    BH: 'BHD', BI: 'BIF', BJ: 'XOF', BL: 'EUR', BM: 'BMD', BN: 'BND', BO: 'BOB',
    BQ: 'USD', BR: 'BRL', BS: 'BSD', BT: 'BTN', BV: 'NOK', BW: 'BWP', BY: 'BYN',
    BZ: 'BZD', CA: 'CAD', CC: 'AUD', CD: 'CDF', CF: 'XAF', CG: 'XAF', CH: 'CHF',
    CI: 'XOF', CK: 'NZD', CL: 'CLP', CM: 'XAF', CN: 'CNY', CO: 'COP', CR: 'CRC',
    CU: 'CUP', CV: 'CVE', CW: 'ANG', CX: 'AUD', CY: 'EUR', CZ: 'CZK', DE: 'EUR',
    DJ: 'DJF', DK: 'DKK', DM: 'XCD', DO: 'DOP', DZ: 'DZD', EC: 'USD', EE: 'EUR',
    EG: 'EGP', EH: 'MAD', ER: 'ERN', ES: 'EUR', ET: 'ETB', FI: 'EUR', FJ: 'FJD',
    FK: 'FKP', FM: 'USD', FO: 'DKK', FR: 'EUR', GA: 'XAF', GB: 'GBP', GD: 'XCD',
    GE: 'GEL', GF: 'EUR', GG: 'GBP', GH: 'GHS', GI: 'GIP', GL: 'DKK', GM: 'GMD',
    GN: 'GNF', GP: 'EUR', GQ: 'XAF', GR: 'EUR', GS: 'GBP', GT: 'GTQ', GU: 'USD',
    GW: 'XOF', GY: 'GYD', HK: 'HKD', HM: 'AUD', HN: 'HNL', HR: 'EUR', HT: 'HTG',
    HU: 'HUF', ID: 'IDR', IE: 'EUR', IL: 'ILS', IM: 'GBP', IN: 'INR', IO: 'USD',
    IQ: 'IQD', IR: 'IRR', IS: 'ISK', IT: 'EUR', JE: 'GBP', JM: 'JMD', JO: 'JOD',
    JP: 'JPY', KE: 'KES', KG: 'KGS', KH: 'KHR', KI: 'AUD', KM: 'KMF', KN: 'XCD',
    KP: 'KPW', KR: 'KRW', KW: 'KWD', KY: 'KYD', KZ: 'KZT', LA: 'LAK', LB: 'LBP',
    LC: 'XCD', LI: 'CHF', LK: 'LKR', LR: 'LRD', LS: 'LSL', LT: 'EUR', LU: 'EUR',
    LV: 'EUR', LY: 'LYD', MA: 'MAD', MC: 'EUR', MD: 'MDL', ME: 'EUR', MF: 'EUR',
    MG: 'MGA', MH: 'USD', MK: 'MKD', ML: 'XOF', MM: 'MMK', MN: 'MNT', MO: 'MOP',
    MP: 'USD', MQ: 'EUR', MR: 'MRU', MS: 'XCD', MT: 'EUR', MU: 'MUR', MV: 'MVR',
    MW: 'MWK', MX: 'MXN', MY: 'MYR', MZ: 'MZN', NA: 'NAD', NC: 'XPF', NE: 'XOF',
    NF: 'AUD', NG: 'NGN', NI: 'NIO', NL: 'EUR', NO: 'NOK', NP: 'NPR', NR: 'AUD',
    NU: 'NZD', NZ: 'NZD', OM: 'OMR', PA: 'PAB', PE: 'PEN', PF: 'XPF', PG: 'PGK',
    PH: 'PHP', PK: 'PKR', PL: 'PLN', PM: 'EUR', PN: 'NZD', PR: 'USD', PS: 'ILS',
    PT: 'EUR', PW: 'USD', PY: 'PYG', QA: 'QAR', RE: 'EUR', RO: 'RON', RS: 'RSD',
    RU: 'RUB', RW: 'RWF', SA: 'SAR', SB: 'SBD', SC: 'SCR', SD: 'SDG', SE: 'SEK',
    SG: 'SGD', SH: 'SHP', SI: 'EUR', SJ: 'NOK', SK: 'EUR', SL: 'SLE', SM: 'EUR',
    SN: 'XOF', SO: 'SOS', SR: 'SRD', SS: 'SSP', ST: 'STN', SV: 'USD', SX: 'ANG',
    SY: 'SYP', SZ: 'SZL', TC: 'USD', TD: 'XAF', TF: 'EUR', TG: 'XOF', TH: 'THB',
    TJ: 'TJS', TK: 'NZD', TL: 'USD', TM: 'TMT', TN: 'TND', TO: 'TOP', TR: 'TRY',
    TT: 'TTD', TV: 'AUD', TW: 'TWD', TZ: 'TZS', UA: 'UAH', UG: 'UGX', UM: 'USD',
    US: 'USD', UY: 'UYU', UZ: 'UZS', VA: 'EUR', VC: 'XCD', VE: 'VES', VG: 'USD',
    VI: 'USD', VN: 'VND', VU: 'VUV', WF: 'XPF', WS: 'WST', XK: 'EUR', YE: 'YER',
    YT: 'EUR', ZA: 'ZAR', ZM: 'ZMW', ZW: 'ZWG',
};

export const ISO_COUNTRY_CODES = Object.keys(COUNTRY_CURRENCY);

let regionNames;

function getRegionDisplayNames() {
    if (!regionNames) {
        try {
            regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        } catch {
            regionNames = null;
        }
    }
    return regionNames;
}

export function isValidCountryCode(code) {
    const normalized = String(code || '').trim().toUpperCase();
    return Object.prototype.hasOwnProperty.call(COUNTRY_CURRENCY, normalized);
}

export function normalizeCountry(code) {
    const normalized = String(code || '').trim().toUpperCase();
    return isValidCountryCode(normalized) ? normalized : DEFAULT_COUNTRY;
}

export function getCountryName(code) {
    const normalized = normalizeCountry(code);
    try {
        return getRegionDisplayNames()?.of(normalized) || normalized;
    } catch {
        return normalized;
    }
}

export function getCurrencyForCountry(code) {
    const country = String(code || '').trim().toUpperCase();
    const mapped = COUNTRY_CURRENCY[country];
    return mapped ? normalizeCurrency(mapped) : APP_CURRENCY;
}

export function getCountrySelectOptions() {
    const options = ISO_COUNTRY_CODES.map((code) => {
        const name = getCountryName(code);
        return {
            value: code,
            label: name,
            searchText: `${name} ${code}`.toLowerCase(),
        };
    });
    options.sort((a, b) => {
        if (a.value === DEFAULT_COUNTRY) return -1;
        if (b.value === DEFAULT_COUNTRY) return 1;
        return a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
    });
    return options;
}
