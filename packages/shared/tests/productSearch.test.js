import test from 'node:test';
import assert from 'node:assert/strict';
import { filterProductsForSuggestion } from '../src/productHelpers.js';

const products = [
    { id: '1', name: 'Gaming chair', description: 'Ergonomic', unitPrice: 300000 },
    { id: '2', name: 'Laptop', description: '15 inch', unitPrice: 2000000 },
    { id: '3', name: 'Laptop Bag', description: '', unitPrice: 25000 },
    { id: '4', name: 'Mouse', description: 'Wireless', unitPrice: 20000 },
];

test('filterProductsForSuggestion prefers name prefix matches', () => {
    const results = filterProductsForSuggestion(products, 'lap');
    assert.deepEqual(
        results.map((product) => product.id),
        ['2', '3']
    );
});

test('filterProductsForSuggestion matches description', () => {
    const results = filterProductsForSuggestion(products, 'wireless');
    assert.deepEqual(results.map((product) => product.id), ['4']);
});

test('filterProductsForSuggestion returns empty for blank query', () => {
    assert.deepEqual(filterProductsForSuggestion(products, ''), []);
    assert.deepEqual(filterProductsForSuggestion(products, '   '), []);
});

test('filterProductsForSuggestion respects limit', () => {
    const results = filterProductsForSuggestion(products, 'l', { limit: 2 });
    assert.equal(results.length, 2);
});
