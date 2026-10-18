import test from 'node:test';
import assert from 'node:assert/strict';
import { applyListUrlPatch, parsePositiveInt, readListUrlValues } from '../src/utils/listUrlState.js';

const DEFAULTS = {
    status: 'all',
    sort: 'newest',
    page: 1,
    q: '',
    period: 'all',
    startDate: '',
    endDate: '',
};

test('parsePositiveInt falls back for invalid values', () => {
    assert.equal(parsePositiveInt('3', 1), 3);
    assert.equal(parsePositiveInt('0', 1), 1);
    assert.equal(parsePositiveInt('nope', 2), 2);
});

test('readListUrlValues uses defaults and keeps unrelated params out of the result', () => {
    const params = new URLSearchParams('status=paid&page=2&add=1');
    assert.deepEqual(readListUrlValues(params, DEFAULTS), {
        status: 'paid',
        sort: 'newest',
        page: 2,
        q: '',
        period: 'all',
        startDate: '',
        endDate: '',
    });
});

test('applyListUrlPatch omits defaults and preserves unrelated keys', () => {
    const prev = new URLSearchParams('add=1&returnTo=/invoices/create');
    const next = applyListUrlPatch(prev, { status: 'paid', page: 1, q: '' }, DEFAULTS);
    assert.equal(next.get('status'), 'paid');
    assert.equal(next.get('page'), null);
    assert.equal(next.get('q'), null);
    assert.equal(next.get('add'), '1');
    assert.equal(next.get('returnTo'), '/invoices/create');
});

test('applyListUrlPatch writes custom period dates', () => {
    const next = applyListUrlPatch(new URLSearchParams(), {
        period: 'custom',
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        page: 3,
    }, DEFAULTS);
    assert.equal(next.get('period'), 'custom');
    assert.equal(next.get('startDate'), '2026-01-01');
    assert.equal(next.get('endDate'), '2026-01-31');
    assert.equal(next.get('page'), '3');
});
