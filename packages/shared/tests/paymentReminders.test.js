import test from 'node:test';
import assert from 'node:assert/strict';
import {
    canSendPaymentReminderNow,
    getNextPaymentReminderDate,
    isAutoPaymentRemindersEnabled,
    msUntilNextPaymentReminder,
    PAYMENT_REMINDER_MIN_DAYS_BETWEEN,
} from '../src/paymentReminders.js';

test('canSendPaymentReminderNow allows first reminder', () => {
    assert.equal(canSendPaymentReminderNow(null), true);
});

test('canSendPaymentReminderNow blocks repeat within minimum interval', () => {
    const now = Date.parse('2026-07-04T12:00:00.000Z');
    const lastSent = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    assert.equal(canSendPaymentReminderNow(lastSent, now), false);
});

test('canSendPaymentReminderNow allows after minimum interval', () => {
    const now = Date.parse('2026-07-04T12:00:00.000Z');
    const daysMs = PAYMENT_REMINDER_MIN_DAYS_BETWEEN * 24 * 60 * 60 * 1000;
    const lastSent = new Date(now - daysMs).toISOString();
    assert.equal(canSendPaymentReminderNow(lastSent, now), true);
});

test('getNextPaymentReminderDate adds minimum interval days', () => {
    const lastSent = '2026-07-01T09:00:00.000Z';
    const next = getNextPaymentReminderDate(lastSent);
    assert.equal(next.toISOString(), '2026-07-04T09:00:00.000Z');
});

test('msUntilNextPaymentReminder returns remaining wait time', () => {
    const now = Date.parse('2026-07-02T12:00:00.000Z');
    const lastSent = '2026-07-01T12:00:00.000Z';
    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    assert.equal(msUntilNextPaymentReminder(lastSent, now), twoDaysMs);
});

test('isAutoPaymentRemindersEnabled defaults to on', () => {
    assert.equal(isAutoPaymentRemindersEnabled(undefined), true);
    assert.equal(isAutoPaymentRemindersEnabled({}), true);
    assert.equal(isAutoPaymentRemindersEnabled({ autoPaymentReminders: true }), true);
    assert.equal(isAutoPaymentRemindersEnabled({ autoPaymentReminders: false }), false);
});
