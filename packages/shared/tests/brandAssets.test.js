import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBusinessInfoSummary } from '../src/brandAssets.js';

const premiumSummary = {
    name: 'Acme Ltd',
    plan: 'premium',
    premiumUntil: '2099-01-01T00:00:00.000Z',
    companyLogoUrl: '',
    companyLogoAvatarUrl: '',
    businessLogo: '',
};

const cachedWithAssets = {
    ...premiumSummary,
    companyLogoUrl: 'data:image/png;base64,logo',
    companyLogoAvatarUrl: 'data:image/jpeg;base64,avatar',
    businessLogo: 'data:image/png;base64,logo',
};

test('mergeBusinessInfoSummary preserves cached assets for premium users', () => {
    const merged = mergeBusinessInfoSummary(cachedWithAssets, premiumSummary);

    assert.equal(merged.companyLogoUrl, cachedWithAssets.companyLogoUrl);
    assert.equal(merged.companyLogoAvatarUrl, cachedWithAssets.companyLogoAvatarUrl);
    assert.equal(merged.businessLogo, cachedWithAssets.businessLogo);
    assert.equal(merged.name, premiumSummary.name);
});

test('mergeBusinessInfoSummary replaces free user data without preserving assets', () => {
    const freeIncoming = {
        name: 'Free Co',
        plan: 'free',
        companyLogoUrl: '',
        companyLogoAvatarUrl: '',
    };

    const merged = mergeBusinessInfoSummary(cachedWithAssets, freeIncoming);

    assert.equal(merged.name, 'Free Co');
    assert.equal(merged.plan, 'free');
    assert.equal(merged.companyLogoUrl, '');
    assert.equal(merged.companyLogoAvatarUrl, '');
});

test('mergeBusinessInfoSummary uses incoming assets when provided', () => {
    const incomingWithAssets = {
        ...premiumSummary,
        companyLogoAvatarUrl: 'data:image/jpeg;base64,new',
    };

    const merged = mergeBusinessInfoSummary(cachedWithAssets, incomingWithAssets);

    assert.equal(merged.companyLogoAvatarUrl, 'data:image/jpeg;base64,new');
});

test('mergeBusinessInfoSummary returns incoming when prev is missing', () => {
    assert.deepEqual(mergeBusinessInfoSummary(null, premiumSummary), premiumSummary);
});
