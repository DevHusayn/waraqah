import test from 'node:test';
import assert from 'node:assert/strict';
import {
    computeBaseAmounts,
    isValidExchangeRate,
    needsExchangeRate,
    resolveDocumentExchangeRate,
} from '../src/documentCurrency.js';

test('needsExchangeRate compares normalized codes', () => {
    assert.equal(needsExchangeRate('NGN', 'NGN'), false);
    assert.equal(needsExchangeRate('usd', 'NGN'), true);
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
