import test from 'node:test';
import assert from 'node:assert/strict';
import {
    formatPeriodPresetLabel,
    formatSummaryPeriodLabel,
    formatDateRangeLabel,
    getDatePartsInTimezone,
    getPeriodComparisonLabel,
    getYearMonthInTimezone,
    getWeekBoundsInTimezone,
    getLastWeekBoundsInTimezone,
    getLastYearMonthInTimezone,
    parseMonthInputValue,
    parseDateInputValue,
    buildPeriodQueryParams,
    isPeriodQueryReady,
    resolveClientPeriodFromFilter,
    dateMatchesClientPeriod,
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
    assert.equal(formatPeriodPresetLabel('today'), 'Today');
    assert.equal(formatPeriodPresetLabel('week'), 'This week');
    assert.equal(formatPeriodPresetLabel('last-week'), 'Last week');
    assert.equal(formatPeriodPresetLabel('month'), 'This month');
    assert.equal(formatPeriodPresetLabel('last-month'), 'Last month');
    assert.equal(formatPeriodPresetLabel('year'), 'This year');
    assert.equal(formatPeriodPresetLabel('custom', null, null, 'en-US', {
        startDate: '2026-08-01',
        endDate: '2026-08-15',
    }), 'Aug 1 – Aug 15, 2026');
    assert.equal(getPeriodComparisonLabel('today'), 'vs yesterday');
    assert.equal(getPeriodComparisonLabel('week', true), 'vs last week');
    assert.equal(getPeriodComparisonLabel('last-week'), 'vs previous week');
    assert.equal(getPeriodComparisonLabel('month', true), 'vs last month');
    assert.equal(getPeriodComparisonLabel('last-month'), 'vs previous month');
    assert.equal(getPeriodComparisonLabel('year', true), 'vs last year');
    assert.equal(getPeriodComparisonLabel('custom'), 'vs previous period');
});

test('buildPeriodQueryParams and readiness', () => {
    assert.deepEqual(buildPeriodQueryParams({ mode: 'month' }), { period: 'month' });
    assert.deepEqual(buildPeriodQueryParams({ mode: 'all' }), { period: 'all' });
    assert.deepEqual(buildPeriodQueryParams({
        mode: 'custom',
        startDate: '2026-08-01',
        endDate: '2026-08-15',
    }), {
        period: 'custom',
        startDate: '2026-08-01',
        endDate: '2026-08-15',
    });
    assert.equal(isPeriodQueryReady({ mode: 'month' }), true);
    assert.equal(isPeriodQueryReady({ mode: 'all' }), true);
    assert.equal(isPeriodQueryReady({ period: 'month' }), true);
    assert.equal(isPeriodQueryReady({ mode: 'custom', startDate: '2026-08-01' }), false);
    assert.equal(isPeriodQueryReady({ period: 'custom', startDate: '2026-08-01', endDate: '2026-08-15' }), true);
});

test('resolveClientPeriodFromFilter and dateMatchesClientPeriod', () => {
    const now = new Date('2026-08-14T12:00:00.000Z');
    const week = resolveClientPeriodFromFilter('week', 'Africa/Lagos', { now });
    assert.equal(week.kind, 'week');
    assert.equal(dateMatchesClientPeriod('2026-08-12', week, 'Africa/Lagos'), true);
    assert.equal(dateMatchesClientPeriod('2026-08-01', week, 'Africa/Lagos'), false);
    const lastWeek = resolveClientPeriodFromFilter('last-week', 'Africa/Lagos', { now });
    assert.deepEqual(lastWeek, {
        kind: 'week',
        startYear: 2026,
        startMonth: 8,
        startDay: 2,
        endYear: 2026,
        endMonth: 8,
        endDay: 8,
    });
    assert.equal(dateMatchesClientPeriod('2026-08-05', lastWeek, 'Africa/Lagos'), true);
    assert.equal(dateMatchesClientPeriod('2026-08-12', lastWeek, 'Africa/Lagos'), false);
    const lastMonth = resolveClientPeriodFromFilter('last-month', 'Africa/Lagos', { now });
    assert.deepEqual(lastMonth, { kind: 'month', year: 2026, month: 7 });
    assert.equal(dateMatchesClientPeriod('2026-07-31', lastMonth, 'Africa/Lagos'), true);
    assert.equal(dateMatchesClientPeriod('2026-08-01', lastMonth, 'Africa/Lagos'), false);
    const range = resolveClientPeriodFromFilter('custom', 'Africa/Lagos', {
        startDate: '2026-08-01',
        endDate: '2026-08-07',
    });
    assert.equal(range.kind, 'range');
    assert.equal(dateMatchesClientPeriod('2026-08-07', range, 'Africa/Lagos'), true);
    const allTime = resolveClientPeriodFromFilter('all', 'Africa/Lagos');
    assert.deepEqual(allTime, { kind: 'all' });
    assert.equal(dateMatchesClientPeriod('2020-01-01', allTime, 'Africa/Lagos'), true);
});

test('getWeekBoundsInTimezone returns Sunday-start week', () => {
    const now = new Date('2026-08-14T12:00:00.000Z');
    const bounds = getWeekBoundsInTimezone('Africa/Lagos', now);
    assert.deepEqual(bounds.start, { year: 2026, month: 8, day: 9 });
    assert.deepEqual(bounds.end, { year: 2026, month: 8, day: 15 });
    assert.deepEqual(getLastWeekBoundsInTimezone('Africa/Lagos', now), {
        start: { year: 2026, month: 8, day: 2 },
        end: { year: 2026, month: 8, day: 8 },
    });
    assert.deepEqual(getLastYearMonthInTimezone('Africa/Lagos', now), { year: 2026, month: 7 });
});
