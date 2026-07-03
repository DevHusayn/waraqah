import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBusinessInfoPayload } from '../src/businessPayload.js';

test('buildBusinessInfoPayload sends only provided profile fields', () => {
    const businessInfo = {
        name: 'Old name',
        address: 'Old address',
        email: 'old@example.com',
        phone: '+234000',
        website: 'https://old.example.com',
        plan: 'premium',
        companyLogoUrl: 'data:image/png;base64,abc',
        companyLogoAvatarUrl: 'data:image/jpeg;base64,def',
    };

    const payload = buildBusinessInfoPayload(
        {
            name: 'New name',
            address: 'New address',
            email: 'new@example.com',
            phone: '+234111',
            website: '',
        },
        businessInfo
    );

    assert.deepEqual(payload, {
        name: 'New name',
        address: 'New address',
        email: 'new@example.com',
        phone: '+234111',
        website: '',
    });
});

test('buildBusinessInfoPayload sends only toggled notification field', () => {
    const businessInfo = {
        autoEmailInvoices: false,
        companyLogoUrl: 'data:image/png;base64,abc',
        plan: 'premium',
    };

    const payload = buildBusinessInfoPayload({ autoEmailInvoices: true }, businessInfo);

    assert.deepEqual(payload, { autoEmailInvoices: true });
});

test('buildBusinessInfoPayload includes only updated logo assets', () => {
    const businessInfo = {
        plan: 'premium',
        companyLogoUrl: 'data:image/png;base64,old',
    };

    const payload = buildBusinessInfoPayload(
        {
            companyLogoUrl: 'data:image/png;base64,new',
            companyLogoAvatarUrl: 'data:image/jpeg;base64,avatar',
        },
        businessInfo
    );

    assert.deepEqual(payload, {
        companyLogoUrl: 'data:image/png;base64,new',
        businessLogo: 'data:image/png;base64,new',
        companyLogoAvatarUrl: 'data:image/jpeg;base64,avatar',
    });
});
