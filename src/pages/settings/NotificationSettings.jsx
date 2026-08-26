import { useState } from 'react';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { isPremiumUser } from '../../utils/premium';
import {
    isAutoPaymentRemindersEnabled,
    isAutoMonthlyStatementsEnabled,
    isLowStockEmailAlertsEnabled,
    LOW_STOCK_EMAIL_COOLDOWN_HOURS,
    PAYMENT_REMINDER_DUE_WINDOW_DAYS,
    PAYMENT_REMINDER_MIN_DAYS_BETWEEN,
} from '@waraqah/shared';

function NotificationToggle({
    title,
    description,
    statusText,
    enabled,
    saving,
    onToggle,
}) {
    return (
        <div className="card">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold text-foreground">{title}</h2>
                    <p className="text-sm text-foreground-muted leading-relaxed max-w-xl">{description}</p>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={enabled}
                    disabled={saving}
                    onClick={onToggle}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 ${
                        enabled ? 'bg-brand' : 'bg-zinc-200'
                    }`}
                >
                    <span
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-surface shadow ring-0 transition ${
                            enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
            <p className="mt-4 text-xs text-foreground-muted">{statusText}</p>
        </div>
    );
}

export default function NotificationSettings() {
    const { businessInfo, updateBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [savingInvoiceEmails, setSavingInvoiceEmails] = useState(false);
    const [savingReminderEmails, setSavingReminderEmails] = useState(false);
    const [savingLowStockEmails, setSavingLowStockEmails] = useState(false);
    const [savingMonthlyStatements, setSavingMonthlyStatements] = useState(false);

    const premium = isPremiumUser(businessInfo);
    const invoiceEmailsEnabled = Boolean(businessInfo.autoEmailInvoices);
    const reminderEmailsEnabled = isAutoPaymentRemindersEnabled(businessInfo);
    const lowStockEmailsEnabled = isLowStockEmailAlertsEnabled(businessInfo);
    const monthlyStatementsEnabled = isAutoMonthlyStatementsEnabled(businessInfo);

    const handleInvoiceEmailToggle = async () => {
        setSavingInvoiceEmails(true);
        try {
            await updateBusinessInfo({ autoEmailInvoices: !invoiceEmailsEnabled });
            showToast(
                !invoiceEmailsEnabled
                    ? 'Clients will be emailed when invoices are finalized.'
                    : 'Automatic invoice emails turned off.',
                'success',
            );
        } catch (err) {
            showToast(err.message || 'Could not save notification settings.', 'error');
        } finally {
            setSavingInvoiceEmails(false);
        }
    };

    const handleReminderEmailToggle = async () => {
        setSavingReminderEmails(true);
        try {
            await updateBusinessInfo({ autoPaymentReminders: !reminderEmailsEnabled });
            showToast(
                !reminderEmailsEnabled
                    ? 'Automatic payment reminders are on.'
                    : 'Automatic payment reminders turned off.',
                'success',
            );
        } catch (err) {
            showToast(err.message || 'Could not save notification settings.', 'error');
        } finally {
            setSavingReminderEmails(false);
        }
    };

    const handleLowStockEmailToggle = async () => {
        setSavingLowStockEmails(true);
        try {
            await updateBusinessInfo({ lowStockEmailAlerts: !lowStockEmailsEnabled });
            showToast(
                !lowStockEmailsEnabled
                    ? 'Daily low-stock email alerts are on.'
                    : 'Low-stock email alerts turned off.',
                'success',
            );
        } catch (err) {
            showToast(err.message || 'Could not save notification settings.', 'error');
        } finally {
            setSavingLowStockEmails(false);
        }
    };

    const handleMonthlyStatementToggle = async () => {
        setSavingMonthlyStatements(true);
        try {
            await updateBusinessInfo({ autoEmailMonthlyStatements: !monthlyStatementsEnabled });
            showToast(
                !monthlyStatementsEnabled
                    ? 'Monthly statement emails are on.'
                    : 'Monthly statement emails turned off.',
                'success',
            );
        } catch (err) {
            showToast(err.message || 'Could not save notification settings.', 'error');
        } finally {
            setSavingMonthlyStatements(false);
        }
    };

    return (
        <SettingsPageShell
            title="Notifications"
            subtitle="Control when Waraqah sends emails to you and your clients"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Notifications', to: '/settings/notifications' },
            ]}
        >
            <div className="space-y-6">
                <NotificationToggle
                    title="Email invoices to clients automatically"
                    description={
                        'When enabled, finalized invoices are emailed to the client as soon as they are created '
                        + 'or when a draft is finalized. You will still receive an owner notification for each send. '
                        + 'Manual "Email to client" always works regardless of this setting.'
                    }
                    statusText={
                        invoiceEmailsEnabled
                            ? 'Automatic client emails are on.'
                            : 'Automatic client emails are off.'
                    }
                    enabled={invoiceEmailsEnabled}
                    saving={savingInvoiceEmails}
                    onToggle={handleInvoiceEmailToggle}
                />

                <NotificationToggle
                    title="Send payment reminders automatically"
                    description={
                        `When enabled, Waraqah emails your client a payment reminder when an invoice is due within `
                        + `${PAYMENT_REMINDER_DUE_WINDOW_DAYS} days or already overdue. Reminders are sent at most once `
                        + `every ${PAYMENT_REMINDER_MIN_DAYS_BETWEEN} days per invoice. You receive a copy in your inbox, `
                        + 'and you can always send a reminder manually from the invoice page.'
                    }
                    statusText={
                        reminderEmailsEnabled
                            ? 'Automatic payment reminders are on.'
                            : 'Automatic payment reminders are off.'
                    }
                    enabled={reminderEmailsEnabled}
                    saving={savingReminderEmails}
                    onToggle={handleReminderEmailToggle}
                />

                <NotificationToggle
                    title="Email me when products are low on stock"
                    description={
                        'When enabled, Waraqah sends you a daily summary of tracked products that have reached '
                        + 'their low-stock threshold. Only products with inventory tracking and a threshold set are included. '
                        + 'You can still see low-stock badges on the Products page anytime.'
                    }
                    statusText={
                        lowStockEmailsEnabled
                            ? `Daily low-stock alerts are on (at most once every ${LOW_STOCK_EMAIL_COOLDOWN_HOURS} hours).`
                            : 'Daily low-stock alerts are off.'
                    }
                    enabled={lowStockEmailsEnabled}
                    saving={savingLowStockEmails}
                    onToggle={handleLowStockEmailToggle}
                />

                {premium ? (
                    <NotificationToggle
                        title="Email me my monthly billing statement"
                        description={
                            'When enabled, Waraqah emails you a PDF summary of the previous month on the 1st of each month. '
                            + 'Only months with issued invoices or receipts are included. You can also download statements anytime from the Statements page.'
                        }
                        statusText={
                            monthlyStatementsEnabled
                                ? 'Monthly statement emails are on (sent on the 1st for the previous month).'
                                : 'Monthly statement emails are off.'
                        }
                        enabled={monthlyStatementsEnabled}
                        saving={savingMonthlyStatements}
                        onToggle={handleMonthlyStatementToggle}
                    />
                ) : null}
            </div>
        </SettingsPageShell>
    );
}
