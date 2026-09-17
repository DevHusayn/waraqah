import test from 'node:test';
import assert from 'node:assert/strict';
import {
    computeBaseAmounts,
    isValidExchangeRate,
    needsExchangeRate,
    needsBooksCurrencyRebase,
    isBooksRebaseRateError,
    parseExchangeRateInput,
    rebaseDocumentBooks,
    correctDocumentBooksRate,
    booksRebaseCorrectionFactor,
    canCorrectBooksRebase,
    resolveDocumentExchangeRate,
    sanitizeExchangeRateInput,
} from '../src/documentCurrency.js';

test('needsExchangeRate compares normalized codes', () => {
    assert.equal(needsExchangeRate('NGN', 'NGN'), false);
    assert.equal(needsExchangeRate('usd', 'NGN'), true);
});

test('needsBooksCurrencyRebase only when the account already has amounts', () => {
    assert.equal(needsBooksCurrencyRebase('NGN', 'USD', false), false);
    assert.equal(needsBooksCurrencyRebase('NGN', 'NGN', true), false);
    assert.equal(needsBooksCurrencyRebase('NGN', 'USD', true), true);
});

test('isBooksRebaseRateError matches the API prompt', () => {
    assert.equal(isBooksRebaseRateError('Enter how many USD equal 1 NGN.'), true);
    assert.equal(isBooksRebaseRateError('Failed to save settings'), false);
});

test('isValidExchangeRate requires a positive number', () => {
    assert.equal(isValidExchangeRate(1500), true);
    assert.equal(isValidExchangeRate('0'), false);
    assert.equal(isValidExchangeRate(''), false);
    assert.equal(isValidExchangeRate(-1), false);
});

test('computeBaseAmounts converts document amounts into business currency', () => {
    const base = computeBaseAmounts({
        subtotal: 10,
        tax: 1,
        discount: 0,
        total: 11,
        amountPaid: 5,
        exchangeRate: 1500,
    });
    assert.equal(base.baseSubtotal, 15000);
    assert.equal(base.baseTax, 1500);
    assert.equal(base.baseTotal, 16500);
    assert.equal(base.baseAmountPaid, 7500);
});

test('resolveDocumentExchangeRate is 1 when currencies match', () => {
    assert.equal(resolveDocumentExchangeRate('NGN', 'NGN', 9), 1);
    assert.equal(resolveDocumentExchangeRate('USD', 'NGN', 1500), 1500);
    assert.equal(resolveDocumentExchangeRate('USD', 'NGN', ''), null);
});

test('sanitizeExchangeRateInput keeps up to 8 decimal places', () => {
    assert.equal(sanitizeExchangeRateInput('0.00067012'), '0.00067012');
    assert.equal(parseExchangeRateInput('0.00067'), 0.00067);
});

test('rebaseDocumentBooks converts matching NGN books into USD', () => {
    const patch = rebaseDocumentBooks(
        {
            currency: 'NGN',
            exchangeRate: 1,
            baseCurrency: 'NGN',
            subtotal: 1500000,
            tax: 0,
            discount: 0,
            total: 1500000,
            amountPaid: 500000,
            baseSubtotal: 1500000,
            baseTotal: 1500000,
            baseAmountPaid: 500000,
            items: [{ description: 'Widget', quantity: 1, rate: 1500000, unitCost: 900000 }],
        },
        { fromCurrency: 'NGN', toCurrency: 'USD', rate: 0.00067, kind: 'invoice' }
    );
    assert.equal(patch.baseCurrency, 'USD');
    assert.equal(patch.exchangeRate, 0.00067);
    assert.equal(patch.baseTotal, 1005);
    assert.equal(patch.baseAmountPaid, 335);
    assert.equal(patch.items[0].unitCost, 603);
    assert.equal(patch.items[0].rate, 1500000);
});

test('rebaseDocumentBooks snaps foreign invoices already in the new currency', () => {
    const patch = rebaseDocumentBooks(
        {
            currency: 'USD',
            exchangeRate: 1500,
            baseCurrency: 'NGN',
            subtotal: 10,
            tax: 0,
            discount: 0,
            total: 10,
            amountPaid: 10,
            baseTotal: 15000,
            baseAmountPaid: 15000,
            items: [{ description: 'Widget', quantity: 1, rate: 10, unitCost: 6000 }],
        },
        { fromCurrency: 'NGN', toCurrency: 'USD', rate: 0.00067, kind: 'invoice' }
    );
    assert.equal(patch.exchangeRate, 1);
    assert.equal(patch.baseCurrency, 'USD');
    assert.equal(patch.baseTotal, 10);
    assert.equal(patch.items[0].unitCost, 4.02);
});

test('rebaseDocumentBooks compounds a third-currency document into the new books', () => {
    const patch = rebaseDocumentBooks(
        {
            currency: 'EUR',
            exchangeRate: 1600,
            baseCurrency: 'NGN',
            subtotal: 10,
            total: 10,
            amountPaid: 0,
            baseTotal: 16000,
            items: [],
        },
        { fromCurrency: 'NGN', toCurrency: 'USD', rate: 0.00067, kind: 'invoice' }
    );
    assert.equal(patch.exchangeRate, 1.072);
    assert.equal(patch.baseCurrency, 'USD');
    assert.equal(patch.baseTotal, 10.72);
});

test('rebaseDocumentBooks leaves documents already on the new books unchanged', () => {
    const patch = rebaseDocumentBooks(
        {
            currency: 'NGN',
            exchangeRate: 0.00067,
            baseCurrency: 'USD',
            total: 1500000,
            baseTotal: 1005,
        },
        { fromCurrency: 'NGN', toCurrency: 'USD', rate: 0.00067 }
    );
    assert.equal(patch, null);
});

test('booksRebaseCorrectionFactor is newRate / oldRate', () => {
    assert.equal(booksRebaseCorrectionFactor(0.00067, 0.00067), 1);
    assert.equal(booksRebaseCorrectionFactor(0.00067, 0.0008), 0.0008 / 0.00067);
    assert.equal(booksRebaseCorrectionFactor(0, 1), null);
});

test('canCorrectBooksRebase requires a last conversion still matching the books currency', () => {
    const last = {
        defaultCurrency: 'USD',
        booksRebaseFrom: 'NGN',
        booksRebaseTo: 'USD',
        booksRebaseRate: 0.00067,
        booksRebasedAt: '2026-09-17T12:00:00.000Z',
    };
    assert.equal(canCorrectBooksRebase(last), true);
    assert.equal(canCorrectBooksRebase({ ...last, defaultCurrency: 'NGN' }), false);
    assert.equal(canCorrectBooksRebase({ defaultCurrency: 'USD' }), false);
});

test('correctDocumentBooksRate restates NGN books after a rate typo', () => {
    const converted = rebaseDocumentBooks(
        {
            currency: 'NGN',
            exchangeRate: 1,
            baseCurrency: 'NGN',
            subtotal: 1500000,
            tax: 0,
            discount: 0,
            total: 1500000,
            amountPaid: 500000,
            baseSubtotal: 1500000,
            baseTotal: 1500000,
            baseAmountPaid: 500000,
            items: [{ description: 'Widget', quantity: 1, rate: 1500000, unitCost: 900000 }],
        },
        { fromCurrency: 'NGN', toCurrency: 'USD', rate: 0.00067, kind: 'invoice' }
    );
    const patch = correctDocumentBooksRate(
        {
            currency: 'NGN',
            subtotal: 1500000,
            tax: 0,
            discount: 0,
            total: 1500000,
            amountPaid: 500000,
            ...converted,
        },
        { fromCurrency: 'NGN', toCurrency: 'USD', oldRate: 0.00067, newRate: 0.0008, kind: 'invoice' }
    );
    assert.equal(patch.exchangeRate, 0.0008);
    assert.equal(patch.baseTotal, 1200);
    assert.equal(patch.baseAmountPaid, 400);
    assert.equal(patch.items[0].unitCost, 720);
    assert.equal(patch.items[0].rate, 1500000);
});

test('correctDocumentBooksRate only scales unit costs for invoices already in the new currency', () => {
    const patch = correctDocumentBooksRate(
        {
            currency: 'USD',
            exchangeRate: 1,
            baseCurrency: 'USD',
            total: 10,
            baseTotal: 10,
            items: [{ description: 'Widget', quantity: 1, rate: 10, unitCost: 4.02 }],
        },
        { fromCurrency: 'NGN', toCurrency: 'USD', oldRate: 0.00067, newRate: 0.0008, kind: 'invoice' }
    );
    assert.equal(patch.baseTotal, undefined);
    assert.equal(patch.items[0].unitCost, 4.8);
    assert.equal(patch.items[0].rate, 10);
});

test('correctDocumentBooksRate compounds a third-currency document', () => {
    const patch = correctDocumentBooksRate(
        {
            currency: 'EUR',
            exchangeRate: 1.072,
            baseCurrency: 'USD',
            subtotal: 10,
            tax: 0,
            discount: 0,
            total: 10,
            amountPaid: 0,
            baseTotal: 10.72,
        },
        { fromCurrency: 'NGN', toCurrency: 'USD', oldRate: 0.00067, newRate: 0.0008 }
    );
    assert.equal(patch.exchangeRate, 1.28);
    assert.equal(patch.baseTotal, 12.8);
});
