import test from 'node:test';
import assert from 'node:assert/strict';
import {
    APP_CURRENCY,
    formatCurrency,
    getCurrencyInfo,
    getCurrencySelectOptions,
    getCurrencySymbol,
    isValidCurrencyCode,
    normalizeCurrency,
} from '../src/currency.js';
import {
    DEFAULT_COUNTRY,
    getCountryName,
    getCountrySelectOptions,
    getCurrencyForCountry,
    isValidCountryCode,
    normalizeCountry,
} from '../src/country.js';

test('normalizeCurrency defaults to NGN and accepts ISO codes', () => {
    assert.equal(normalizeCurrency(), APP_CURRENCY);
    assert.equal(normalizeCurrency(''), APP_CURRENCY);
    assert.equal(normalizeCurrency('usd'), 'USD');
    assert.equal(normalizeCurrency('EUR'), 'EUR');
    assert.equal(normalizeCurrency('XXX'), APP_CURRENCY);
    assert.equal(normalizeCurrency('naira'), APP_CURRENCY);
});

test('isValidCurrencyCode accepts ISO 4217 and rejects junk', () => {
    assert.equal(isValidCurrencyCode('NGN'), true);
    assert.equal(isValidCurrencyCode('jpy'), true);
    assert.equal(isValidCurrencyCode('XXX'), false);
    assert.equal(isValidCurrencyCode('NG'), false);
});

test('getCurrencyInfo resolves symbol and name via Intl', () => {
    const ngn = getCurrencyInfo('NGN');
    assert.equal(ngn.code, 'NGN');
    assert.match(ngn.name, /naira/i);
    assert.ok(ngn.symbol);

    const usd = getCurrencyInfo('USD');
    assert.equal(usd.code, 'USD');
    assert.match(usd.symbol, /\$/);
});

test('formatCurrency uses Intl currency style', () => {
    assert.match(formatCurrency(1234.5, 'USD'), /1,234/);
    assert.match(formatCurrency(1234.5, 'USD'), /\$/);
    assert.match(formatCurrency(1500, 'EUR'), /1,500/);
    assert.equal(formatCurrency(1200, 'JPY'), new Intl.NumberFormat('en', {
        style: 'currency',
        currency: 'JPY',
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(1200));
    assert.match(formatCurrency(500, 'USD', false), /^USD/);
    assert.match(formatCurrency(1000, false), /^NGN/);
});

test('getCurrencySymbol returns symbol or ISO code', () => {
    assert.equal(getCurrencySymbol('USD', false), 'USD');
    assert.equal(getCurrencySymbol(false), 'NGN');
    assert.match(getCurrencySymbol('USD'), /\$/);
});

test('getCurrencySelectOptions pins NGN and includes major currencies', () => {
    const options = getCurrencySelectOptions();
    assert.equal(options[0].value, 'NGN');
    assert.match(options[0].label, /Naira/);
    const codes = new Set(options.map((option) => option.value));
    assert.equal(codes.has('USD'), true);
    assert.equal(codes.has('EUR'), true);
    assert.equal(codes.has('GHS'), true);
    assert.equal(codes.has('JPY'), true);
});

test('getCurrencySelectOptions compact labels pin the selected currency', () => {
    const options = getCurrencySelectOptions({ compact: true, pin: 'SAR' });
    assert.equal(options[0].value, 'SAR');
    assert.equal(options[0].label, 'SAR');
    assert.match(options[0].listLabel, /riyal/i);
});

test('country defaults and currency suggestions', () => {
    assert.equal(DEFAULT_COUNTRY, 'NG');
    assert.equal(normalizeCountry(), 'NG');
    assert.equal(normalizeCountry('gh'), 'GH');
    assert.equal(normalizeCountry('XX'), 'NG');
    assert.equal(isValidCountryCode('US'), true);
    assert.equal(isValidCountryCode('XX'), false);
    assert.equal(getCurrencyForCountry('NG'), 'NGN');
    assert.equal(getCurrencyForCountry('GH'), 'GHS');
    assert.equal(getCurrencyForCountry('US'), 'USD');
    assert.equal(getCurrencyForCountry('DE'), 'EUR');
    assert.equal(getCurrencyForCountry('AE'), 'AED');
    assert.equal(getCurrencyForCountry('unknown'), 'NGN');
    assert.match(getCountryName('NG'), /Nigeria/i);
    assert.match(getCountryName('GH'), /Ghana/i);
});

test('getCountrySelectOptions pins Nigeria', () => {
    const options = getCountrySelectOptions();
    assert.equal(options[0].value, 'NG');
    assert.match(options[0].label, /Nigeria/i);
    const codes = new Set(options.map((option) => option.value));
    assert.equal(codes.has('US'), true);
    assert.equal(codes.has('GB'), true);
    assert.equal(codes.has('ZA'), true);
});
