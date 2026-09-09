import test from 'node:test';
import assert from 'node:assert/strict';
import { filterVendorsForSuggestion, uniqueVendorNames } from '../src/vendorHelpers.js';

const vendors = ['Dangote', 'Danladi Ventures', 'Landlord', 'NEPA'];

test('uniqueVendorNames trims, drops blanks, and de-dupes case-insensitively', () => {
    assert.deepEqual(
        uniqueVendorNames(['  Dangote ', 'dangote', '', 'Landlord', null, '  ']),
        ['Dangote', 'Landlord']
    );
});

test('filterVendorsForSuggestion prefers name prefix matches', () => {
    const results = filterVendorsForSuggestion(vendors, 'dan');
    assert.deepEqual(results, ['Dangote', 'Danladi Ventures']);
});

test('filterVendorsForSuggestion matches keywords inside the name', () => {
    const results = filterVendorsForSuggestion(vendors, 'vent');
    assert.deepEqual(results, ['Danladi Ventures']);
});

test('filterVendorsForSuggestion returns empty for blank query', () => {
    assert.deepEqual(filterVendorsForSuggestion(vendors, ''), []);
    assert.deepEqual(filterVendorsForSuggestion(vendors, '   '), []);
});

test('filterVendorsForSuggestion respects limit', () => {
    const results = filterVendorsForSuggestion(vendors, 'a', { limit: 2 });
    assert.equal(results.length, 2);
});
