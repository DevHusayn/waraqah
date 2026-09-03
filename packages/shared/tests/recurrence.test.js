import test from 'node:test';
import assert from 'node:assert/strict';
import {
    addDaysToIsoDate,
    addFrequency,
    computeRecurringDueDate,
    daysBetweenIsoDates,
    formatRecurringSummary,
    isRecurringFrequency,
    parseIsoDate,
    shouldGenerateRecurrence,
    toRecurringApiFields,
} from '../src/recurrence.js';

test('isRecurringFrequency accepts known values only', () => {
    assert.equal(isRecurringFrequency('monthly'), true);
    assert.equal(isRecurringFrequency('bi-weekly'), true);
    assert.equal(isRecurringFrequency('daily'), false);
});

test('addFrequency uses calendar months and clamps month-end', () => {
    assert.equal(addFrequency('2026-01-31', 'monthly'), '2026-02-28');
    assert.equal(addFrequency('2024-01-31', 'monthly'), '2024-02-29');
    assert.equal(addFrequency('2026-01-15', 'monthly'), '2026-02-15');
    assert.equal(addFrequency('2026-11-30', 'monthly'), '2026-12-30');
    assert.equal(addFrequency('2026-01-31', 'quarterly'), '2026-04-30');
    assert.equal(addFrequency('2024-02-29', 'yearly'), '2025-02-28');
});

test('addFrequency uses exact day counts for weekly intervals', () => {
    assert.equal(addFrequency('2026-08-26', 'weekly'), '2026-09-02');
    assert.equal(addFrequency('2026-08-26', 'bi-weekly'), '2026-09-09');
});

test('addFrequency rejects invalid input', () => {
    assert.equal(addFrequency('not-a-date', 'monthly'), null);
    assert.equal(addFrequency('2026-08-26', 'daily'), null);
    assert.equal(parseIsoDate('2026-02-30'), null);
});

test('shouldGenerateRecurrence honors next date and optional end date', () => {
    assert.equal(shouldGenerateRecurrence({ nextDate: '2026-09-01', today: '2026-09-01' }), true);
    assert.equal(shouldGenerateRecurrence({ nextDate: '2026-09-02', today: '2026-09-01' }), false);
    assert.equal(
        shouldGenerateRecurrence({
            nextDate: '2026-09-01',
            endDate: '2026-08-31',
            today: '2026-09-01',
        }),
        false
    );
    assert.equal(
        shouldGenerateRecurrence({
            nextDate: '2026-09-01',
            endDate: null,
            today: '2026-09-01',
        }),
        true
    );
});

test('due date offset is preserved across a generated occurrence', () => {
    assert.equal(daysBetweenIsoDates('2026-08-26', '2026-09-09'), 14);
    assert.equal(addDaysToIsoDate('2026-09-26', 14), '2026-10-10');
    assert.equal(computeRecurringDueDate('2026-08-26', '2026-09-09', '2026-09-26'), '2026-10-10');
});

test('toRecurringApiFields keeps schedule fields when repeating is on', () => {
    assert.deepEqual(
        toRecurringApiFields({
            isRecurring: true,
            recurringFrequency: 'monthly',
            recurringEndDate: '2026-12-31',
        }),
        {
            isRecurring: true,
            recurringFrequency: 'monthly',
            recurringEndDate: '2026-12-31',
        }
    );
});

test('toRecurringApiFields clears schedule fields when repeating is off', () => {
    assert.deepEqual(
        toRecurringApiFields({
            isRecurring: false,
            recurringFrequency: 'monthly',
            recurringEndDate: '2026-12-31',
        }),
        {
            isRecurring: false,
            recurringFrequency: undefined,
            recurringEndDate: null,
        }
    );
});

test('formatRecurringSummary describes open-ended and ending series', () => {
    assert.match(formatRecurringSummary({ frequency: 'monthly' }), /until you stop it/);
    assert.match(
        formatRecurringSummary({ frequency: 'weekly', endDate: '2026-12-31', nextDate: '2026-09-02' }),
        /until 2026-12-31/
    );
});
