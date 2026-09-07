import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ensureLineItemProducts,
    filterProductsForSuggestion,
    findCatalogProductForLineItem,
} from '../src/productHelpers.js';

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

test('findCatalogProductForLineItem matches by id, name, and name — details', () => {
    assert.equal(findCatalogProductForLineItem({ productId: '2' }, products)?.id, '2');
    assert.equal(findCatalogProductForLineItem({ description: 'laptop' }, products)?.id, '2');
    assert.equal(
        findCatalogProductForLineItem({ description: 'Laptop — 15 inch' }, products)?.id,
        '2'
    );
    assert.equal(findCatalogProductForLineItem({ description: 'Unknown' }, products), null);
});

test('ensureLineItemProducts creates missing catalog products and reuses them', async () => {
    const created = [];
    let nextId = 10;
    const addProduct = async (payload) => {
        const product = { id: String(nextId++), ...payload };
        created.push(product);
        return product;
    };

    const items = await ensureLineItemProducts(
        [
            { description: 'Laptop', quantity: 1, rate: 2000000 },
            { description: 'Custom stand', quantity: 2, rate: 15000 },
            { description: 'custom stand', quantity: 1, rate: 16000 },
            { description: '', quantity: 1, rate: 0 },
        ],
        products,
        { addProduct }
    );

    assert.equal(items[0].productId, '2');
    assert.equal(items[1].productId, '10');
    assert.equal(items[2].productId, '10');
    assert.equal(items[3].productId, undefined);
    assert.equal(created.length, 1);
    assert.equal(created[0].name, 'Custom stand');
    assert.equal(created[0].unitPrice, 15000);
});

test('ensureLineItemProducts skips creating when createIfMissing is false', async () => {
    let called = 0;
    const items = await ensureLineItemProducts(
        [{ description: 'Brand new item', quantity: 1, rate: 500 }],
        products,
        { addProduct: async () => { called += 1; }, createIfMissing: false }
    );
    assert.equal(called, 0);
    assert.equal(items[0].productId, undefined);
});
