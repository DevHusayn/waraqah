import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRegisterStep } from '../src/registerValidation.js';

const validForm = {
    email: 'user@example.com',
    password: 'Password1',
    name: 'Acme Ltd',
    address: '123 Main St',
    businessEmail: 'billing@acme.com',
    phone: '+234 800 000 0000',
    brandColor: '#16A34A',
};

test('validateRegisterStep requires terms acceptance on step 4', () => {
    const withoutConsent = validateRegisterStep(4, validForm, 'Password1', {
        acceptedTerms: false,
    });

    assert.equal(withoutConsent.firstInvalid, 'acceptedTerms');
    assert.match(withoutConsent.errors.acceptedTerms, /agree/i);
});

test('validateRegisterStep passes step 4 when terms are accepted', () => {
    const withConsent = validateRegisterStep(4, validForm, 'Password1', {
        acceptedTerms: true,
    });

    assert.equal(withConsent.firstInvalid, null);
    assert.equal(withConsent.errors.acceptedTerms, '');
});

test('validateRegisterStep does not require terms on earlier steps', () => {
    const step1 = validateRegisterStep(1, validForm, 'Password1', {
        acceptedTerms: false,
    });

    assert.notEqual(step1.firstInvalid, 'acceptedTerms');
});
