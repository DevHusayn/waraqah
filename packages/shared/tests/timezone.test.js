import test from 'node:test';
import assert from 'node:assert/strict';
import {
    formatPeriodPresetLabel,
    formatSummaryPeriodLabel,
    getDatePartsInTimezone,
    getPeriodComparisonLabel,
    getYearMonthInTimezone,
    parseMonthInputValue,
    shiftDateByDays,
    shiftSummaryPeriod,
    toDateInputValue,
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

test('getDatePartsInTimezone uses Africa/Lagos calendar day', () => {
    const afternoon = getDatePartsInTimezone(
        'Africa/Lagos',
        new Date('2026-08-14T12:00:00.000Z')
    );
    assert.deepEqual(afternoon, { year: 2026, month: 8, day: 14 });

    const nextDayInLagos = getDatePartsInTimezone(
        'Africa/Lagos',
        new Date('2026-08-14T23:30:00.000Z')
    );
    assert.deepEqual(nextDayInLagos, { year: 2026, month: 8, day: 15 });
});

test('shiftDateByDays moves across month boundary', () => {
    assert.deepEqual(shiftDateByDays(2026, 8, 1, -1), { year: 2026, month: 7, day: 31 });
    assert.deepEqual(shiftDateByDays(2026, 12, 31, 1), { year: 2027, month: 1, day: 1 });
    assert.equal(toDateInputValue(2026, 8, 14), '2026-08-14');
});

test('period preset labels and comparison copy', () => {
    assert.equal(formatPeriodPresetLabel('all'), 'All time');
    assert.equal(formatPeriodPresetLabel('today'), 'Today');
    assert.match(formatPeriodPresetLabel('month', 2026, 8), /August 2026/);
    assert.equal(getPeriodComparisonLabel('all'), null);
    assert.equal(getPeriodComparisonLabel('today'), 'vs yesterday');
    assert.equal(getPeriodComparisonLabel('month', true), 'vs last month');
    assert.equal(getPeriodComparisonLabel('month', false), 'vs previous month');
});
