import test from 'node:test';
import assert from 'node:assert/strict';
import {
    calculateInvoiceSubtotal,
    calculateInvoiceDiscount,
    calculateInvoiceTax,
    calculateInvoiceTotals,
} from '../src/invoiceTotals.js';

test('calculateInvoiceSubtotal sums line items', () => {
    const subtotal = calculateInvoiceSubtotal([
        { quantity: 2, rate: 1000 },
        { quantity: 1, rate: 500 },
    ]);

    assert.equal(subtotal, 2500);
});

test('calculateInvoiceDiscount applies fixed discount capped at subtotal', () => {
    assert.equal(calculateInvoiceDiscount(1000, 'fixed', 200), 200);
    assert.equal(calculateInvoiceDiscount(1000, 'fixed', 2000), 1000);
});

test('calculateInvoiceDiscount applies percent discount', () => {
    assert.equal(calculateInvoiceDiscount(1000, 'percent', 10), 100);
    assert.equal(calculateInvoiceDiscount(1000, 'percent', 150), 1000);
});

test('calculateInvoiceTax applies rate after discount', () => {
    assert.equal(calculateInvoiceTax(1000, 100, 7.5), 67.5);
});

test('calculateInvoiceTotals combines subtotal, discount, tax, and total', () => {
    const totals = calculateInvoiceTotals(
        [{ quantity: 1, rate: 10000 }],
        { taxRate: 7.5, discountType: 'fixed', discountValue: 1000 }
    );

    assert.equal(totals.subtotal, 10000);
    assert.equal(totals.discount, 1000);
    assert.equal(totals.tax, 675);
    assert.equal(totals.total, 9675);
});
