import test from 'node:test';
import assert from 'node:assert/strict';
import {
    isAutoMonthlyStatementsEnabled,
    formatStatementPeriodKey,
} from '../src/monthlyStatementEmail.js';

test('isAutoMonthlyStatementsEnabled defaults to on', () => {
    assert.equal(isAutoMonthlyStatementsEnabled(undefined), true);
    assert.equal(isAutoMonthlyStatementsEnabled({}), true);
    assert.equal(isAutoMonthlyStatementsEnabled({ autoEmailMonthlyStatements: true }), true);
    assert.equal(isAutoMonthlyStatementsEnabled({ autoEmailMonthlyStatements: false }), false);
});

test('formatStatementPeriodKey zero-pads month', () => {
    assert.equal(formatStatementPeriodKey(2026, 7), '2026-07');
    assert.equal(formatStatementPeriodKey(2026, 12), '2026-12');
});
