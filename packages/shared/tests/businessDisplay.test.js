import test from 'node:test';
import assert from 'node:assert/strict';
import {
    DEFAULT_PAYMENT_INSTRUCTIONS,
    hasInvoicePaymentAccount,
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
