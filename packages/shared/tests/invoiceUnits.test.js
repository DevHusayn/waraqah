import test from 'node:test';
import assert from 'node:assert/strict';
import {
    CUSTOM_UNIT_OPTION,
    DEFAULT_INVOICE_UNIT,
    buildUnitSelectOptions,
    normalizeInvoiceUnit,
    resolveQuantityColumnLabel,
} from '../src/invoiceUnits.js';

test('normalizeInvoiceUnit defaults blank values to Qty', () => {
    assert.equal(normalizeInvoiceUnit(''), DEFAULT_INVOICE_UNIT);
    assert.equal(normalizeInvoiceUnit(null), DEFAULT_INVOICE_UNIT);
    assert.equal(normalizeInvoiceUnit('  Hours  '), 'Hours');
});

test('resolveQuantityColumnLabel uses shared unit when all items match', () => {
    assert.equal(
        resolveQuantityColumnLabel([
            { unit: 'Hours' },
            { unit: 'Hours' },
        ]),
        'Hours'
    );
});

test('resolveQuantityColumnLabel falls back to Qty when units differ', () => {
    assert.equal(
        resolveQuantityColumnLabel([
            { unit: 'Hours' },
            { unit: 'Days' },
        ]),
        DEFAULT_INVOICE_UNIT
    );
});

test('buildUnitSelectOptions includes custom unit and Custom option', () => {
    const options = buildUnitSelectOptions('Lesson');
    assert.ok(options.some((opt) => opt.value === 'Lesson'));
    assert.ok(options.some((opt) => opt.value === CUSTOM_UNIT_OPTION));
});
