/** Minimum days between payment reminder emails (manual or automatic). */
export const PAYMENT_REMINDER_MIN_DAYS_BETWEEN = 3;

/** Automatic reminders are sent when due within this many days or already overdue. */
export const PAYMENT_REMINDER_DUE_WINDOW_DAYS = 7;

export function parsePaymentReminderDate(value) {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export function msUntilNextPaymentReminder(lastPaymentReminderAt, now = Date.now()) {
    const lastSent = parsePaymentReminderDate(lastPaymentReminderAt);
    if (!lastSent) return 0;
    const minMs = PAYMENT_REMINDER_MIN_DAYS_BETWEEN * 24 * 60 * 60 * 1000;
    const elapsed = now - lastSent.getTime();
    return Math.max(0, minMs - elapsed);
}

export function canSendPaymentReminderNow(lastPaymentReminderAt, now = Date.now()) {
    return msUntilNextPaymentReminder(lastPaymentReminderAt, now) === 0;
}

export function getNextPaymentReminderDate(lastPaymentReminderAt) {
    const lastSent = parsePaymentReminderDate(lastPaymentReminderAt);
    if (!lastSent) return null;
    const next = new Date(lastSent);
    next.setDate(next.getDate() + PAYMENT_REMINDER_MIN_DAYS_BETWEEN);
    return next;
}

export function isAutoPaymentRemindersEnabled(businessInfo) {
    return businessInfo?.autoPaymentReminders !== false;
}
