import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLineItemAddFieldErrors, buildLineItemFieldErrors } from '../src/invoiceFormValidation.js';

const item = (overrides = {}) => ({
    description: 'Consulting',
    quantity: 1,
    rate: 100,
    ...overrides,
});

test('buildLineItemAddFieldErrors rejects empty description', () => {
    const errors = buildLineItemAddFieldErrors(item({ description: '' }), 0);
    assert.equal(errors['item-0-description'], 'Please enter a description.');
});

test('buildLineItemAddFieldErrors rejects zero rate placeholder', () => {
    const errors = buildLineItemAddFieldErrors(item({ rate: 0 }), 0);
    assert.equal(errors['item-0-rate'], 'Please enter a rate.');
});

test('buildLineItemFieldErrors allows zero rate on final submit validation', () => {
    const errors = buildLineItemFieldErrors(item({ rate: 0 }), 0);
    assert.equal(errors['item-0-rate'], undefined);
});

test('buildLineItemAddFieldErrors passes complete item', () => {
    const errors = buildLineItemAddFieldErrors(item(), 0);
    assert.deepEqual(errors, {});
});
