import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isLowStockEmailAlertsEnabled,
    isLowStockProduct,
    LOW_STOCK_EMAIL_COOLDOWN_HOURS,
} from '../src/lowStockAlerts.js';

test('isLowStockEmailAlertsEnabled defaults to off', () => {
    assert.equal(isLowStockEmailAlertsEnabled(undefined), false);
    assert.equal(isLowStockEmailAlertsEnabled({}), false);
    assert.equal(isLowStockEmailAlertsEnabled({ lowStockEmailAlerts: false }), false);
    assert.equal(isLowStockEmailAlertsEnabled({ lowStockEmailAlerts: true }), true);
});

test('isLowStockProduct respects inventory tracking and threshold', () => {
    assert.equal(isLowStockProduct(null), false);
    assert.equal(isLowStockProduct({ trackInventory: false, quantityOnHand: 0, lowStockThreshold: 5 }), false);
    assert.equal(isLowStockProduct({ trackInventory: true, quantityOnHand: 3, lowStockThreshold: null }), false);
    assert.equal(isLowStockProduct({ trackInventory: true, quantityOnHand: 5, lowStockThreshold: 5 }), true);
    assert.equal(isLowStockProduct({ trackInventory: true, quantityOnHand: 2, lowStockThreshold: 5 }), true);
    assert.equal(isLowStockProduct({ trackInventory: true, quantityOnHand: 6, lowStockThreshold: 5 }), false);
});

test('LOW_STOCK_EMAIL_COOLDOWN_HOURS is 24', () => {
    assert.equal(LOW_STOCK_EMAIL_COOLDOWN_HOURS, 24);
});
