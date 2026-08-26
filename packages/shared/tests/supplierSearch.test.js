import test from 'node:test';
import assert from 'node:assert/strict';
import { filterSuppliersForSuggestion } from '../src/supplierHelpers.js';

const suppliers = [
    { id: '1', name: 'Tech Supplies Ltd', company: 'Tech Supplies', email: 'tech@example.com' },
    { id: '2', name: 'Abdullah Trading', email: 'abd@example.com' },
    { id: '3', name: 'Global Parts', company: 'Global Parts Co', phone: '08012345678' },
];

test('filterSuppliersForSuggestion prefers name prefix matches', () => {
    const results = filterSuppliersForSuggestion(suppliers, 'tech');
    assert.deepEqual(results.map((supplier) => supplier.id), ['1']);
});

test('filterSuppliersForSuggestion matches company and email', () => {
    const results = filterSuppliersForSuggestion(suppliers, 'abd@');
    assert.deepEqual(results.map((supplier) => supplier.id), ['2']);
});

test('filterSuppliersForSuggestion returns empty for blank query', () => {
    assert.deepEqual(filterSuppliersForSuggestion(suppliers, ''), []);
});

test('filterSuppliersForSuggestion respects limit', () => {
    const results = filterSuppliersForSuggestion(suppliers, 'a', { limit: 2 });
    assert.equal(results.length, 2);
});
