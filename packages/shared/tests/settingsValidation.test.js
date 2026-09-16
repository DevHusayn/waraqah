import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { needsBusinessSetup, buildAccountFieldErrors } from '../src/settingsValidation.js';

describe('needsBusinessSetup', () => {
    it('returns true when required profile fields are missing', () => {
        assert.equal(
            needsBusinessSetup({
                name: 'Acme Ltd',
                email: 'hello@acme.com',
            }),
            true
        );
    });

    it('returns false when required profile fields are present', () => {
        assert.equal(
            needsBusinessSetup({
                name: 'Acme Ltd',
                address: '12 Market Street',
                email: 'hello@acme.com',
                phone: '08012345678',
            }),
            false
        );
    });
});

describe('buildAccountFieldErrors', () => {
    it('allows IBAN in place of account number', () => {
        const errors = buildAccountFieldErrors({
            paymentAccountName: 'Acme Ltd',
            paymentBankName: 'Barclays',
            paymentAccountNumber: '',
            paymentIban: 'GB82WEST12345698765432',
        });
        assert.equal(errors.paymentAccountNumber, undefined);
    });

    it('does not require local account fields when only IBAN is set', () => {
        const errors = buildAccountFieldErrors({
            paymentIban: 'GB82WEST12345698765432',
        });
        assert.equal(Object.keys(errors).length, 0);
    });
});
