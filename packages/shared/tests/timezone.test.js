import test from 'node:test';
import assert from 'node:assert/strict';
import {
    formatSummaryPeriodLabel,
    getYearMonthInTimezone,
    parseMonthInputValue,
    shiftSummaryPeriod,
    toMonthInputValue,
} from '../src/timezone.js';

test('month input helpers round-trip', () => {
    assert.equal(toMonthInputValue(2026, 8), '2026-08');
    assert.deepEqual(parseMonthInputValue('2026-08'), { year: 2026, month: 8 });
});

test('shiftSummaryPeriod moves across year boundary', () => {
    assert.deepEqual(shiftSummaryPeriod(2026, 1, -1), { year: 2025, month: 12 });
    assert.deepEqual(shiftSummaryPeriod(2026, 12, 1), { year: 2027, month: 1 });
});

test('formatSummaryPeriodLabel renders readable month', () => {
    assert.match(formatSummaryPeriodLabel(2026, 8), /August 2026/);
});

test('getYearMonthInTimezone returns numeric month/year', () => {
    const period = getYearMonthInTimezone('Africa/Lagos', new Date('2026-08-15T12:00:00.000Z'));
    assert.equal(typeof period.year, 'number');
    assert.equal(typeof period.month, 'number');
    assert.ok(period.month >= 1 && period.month <= 12);
});
