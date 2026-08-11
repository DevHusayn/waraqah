import test from 'node:test';
import assert from 'node:assert/strict';
import {
    aggregateCatalogQuantities,
    collectStockShortfalls,
    formatInsufficientStockMessage,
    isInventoryTracked,
    isOversellingAllowed,
} from '../src/inventorySettings.js';

test('isOversellingAllowed defaults to off', () => {
    assert.equal(isOversellingAllowed(undefined), false);
    assert.equal(isOversellingAllowed({}), false);
    assert.equal(isOversellingAllowed({ allowOverselling: false }), false);
    assert.equal(isOversellingAllowed({ allowOverselling: true }), true);
});

test('aggregateCatalogQuantities sums tracked catalog lines', () => {
    const map = aggregateCatalogQuantities([
        { productId: 'p1', quantity: 2 },
        { productId: 'p1', quantity: 3 },
        { description: 'Manual', quantity: 5 },
    ]);

    assert.equal(map.get('p1'), 5);
    assert.equal(map.size, 1);
});

test('isInventoryTracked treats missing and false as untracked', () => {
    assert.equal(isInventoryTracked(undefined), false);
    assert.equal(isInventoryTracked({ trackInventory: false }), false);
    assert.equal(isInventoryTracked({ trackInventory: true }), true);
});

test('collectStockShortfalls skips untracked catalog products', () => {
    const products = [
        { id: 'p1', name: 'Fish', trackInventory: false, quantityOnHand: 0 },
    ];

    const shortfalls = collectStockShortfalls({
        items: [{ productId: 'p1', quantity: 5 }],
        products,
    });

    assert.equal(shortfalls.length, 0);
});

test('collectStockShortfalls blocks when additional deduction exceeds stock', () => {
    const products = [
        { id: 'p1', name: 'Chair', trackInventory: true, quantityOnHand: 1 },
    ];

    const shortfalls = collectStockShortfalls({
        items: [{ productId: 'p1', quantity: 3 }],
        products,
    });

    assert.equal(shortfalls.length, 1);
    assert.equal(shortfalls[0].shortfall, 2);
});

test('collectStockShortfalls allows overselling when enabled', () => {
    const products = [
        { id: 'p1', name: 'Chair', trackInventory: true, quantityOnHand: 0 },
    ];

    const shortfalls = collectStockShortfalls({
        items: [{ productId: 'p1', quantity: 2 }],
        products,
        allowOverselling: true,
    });

    assert.equal(shortfalls.length, 0);
});

test('collectStockShortfalls accounts for previously committed quantities on edit', () => {
    const products = [
        { id: 'p1', name: 'Chair', trackInventory: true, quantityOnHand: 1 },
    ];

    const shortfalls = collectStockShortfalls({
        items: [{ productId: 'p1', quantity: 3 }],
        products,
        prevCommitted: new Map([['p1', 2]]),
    });

    assert.equal(shortfalls.length, 0);
});

test('formatInsufficientStockMessage renders single and multiple products', () => {
    assert.match(
        formatInsufficientStockMessage([{ name: 'Chair', available: 1 }]),
        /Chair exceeds available stock \(1 on hand\)/,
    );
    assert.match(
        formatInsufficientStockMessage([
            { name: 'Chair', available: 0 },
            { name: 'Desk', available: 2 },
        ]),
        /Chair, Desk/,
    );
});
