import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_PAYMENT_INSTRUCTIONS,
    hasInvoicePaymentAccount,
    getInvoicePaymentLines,
    withDefaultPaymentInstructions,
} from '../src/businessDisplay.js';

test('hasInvoicePaymentAccount is false when only payment instructions are set', () => {
    assert.equal(
        hasInvoicePaymentAccount({
            paymentInstructions: DEFAULT_PAYMENT_INSTRUCTIONS,
        }),
        false
    );
});

test('hasInvoicePaymentAccount is true when a bank account field is set', () => {
    assert.equal(hasInvoicePaymentAccount({ paymentBankName: 'GTBank' }), true);
    assert.equal(hasInvoicePaymentAccount({ paymentAccountName: 'Waraqah Ltd' }), true);
    assert.equal(hasInvoicePaymentAccount({ paymentAccountNumber: '0123456789' }), true);
    assert.equal(hasInvoicePaymentAccount({ paymentSortCode: '12-34-56' }), true);
    assert.equal(hasInvoicePaymentAccount({ paymentIban: 'GB82WEST12345698765432' }), true);
    assert.equal(hasInvoicePaymentAccount({ paymentSwift: 'NWBKGB2L' }), true);
});

test('getInvoicePaymentLines includes filled international fields', () => {
    assert.deepEqual(
        getInvoicePaymentLines({
            paymentBankName: 'Barclays',
            paymentAccountName: 'Acme Ltd',
            paymentSortCode: '12-34-56',
            paymentIban: 'GB82 WEST 1234 5698 7654 32',
            paymentSwift: 'BARCGB22',
            paymentInstructions: 'Use invoice number as reference',
        }),
        [
            'Bank Name: Barclays',
            'Account Name: Acme Ltd',
            'Sort Code / Routing Number: 12-34-56',
            'IBAN: GB82 WEST 1234 5698 7654 32',
            'SWIFT / BIC: BARCGB22',
            'Use invoice number as reference',
        ]
    );
});

test('withDefaultPaymentInstructions fills empty instructions and keeps custom text', () => {
    assert.equal(
        withDefaultPaymentInstructions({ paymentAccountName: 'Acme' }).paymentInstructions,
        DEFAULT_PAYMENT_INSTRUCTIONS
    );
    assert.equal(
        withDefaultPaymentInstructions({ paymentInstructions: 'Pay via transfer' }).paymentInstructions,
        'Pay via transfer'
    );
});
