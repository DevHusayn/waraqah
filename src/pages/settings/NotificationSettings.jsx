import { useState } from 'react';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import {
    isAutoPaymentRemindersEnabled,
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
                    <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
                    <p className="text-sm text-zinc-600 leading-relaxed max-w-xl">{description}</p>
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
                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${
                            enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                </button>
            </div>
            <p className="mt-4 text-xs text-zinc-500">{statusText}</p>
        </div>
    );
}

export default function NotificationSettings() {
    const { businessInfo, updateBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [savingInvoiceEmails, setSavingInvoiceEmails] = useState(false);
    const [savingReminderEmails, setSavingReminderEmails] = useState(false);

    const invoiceEmailsEnabled = Boolean(businessInfo.autoEmailInvoices);
    const reminderEmailsEnabled = isAutoPaymentRemindersEnabled(businessInfo);

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

    return (
        <SettingsPageShell
            title="Notifications"
            subtitle="Control when Waraqah emails your clients"
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
            </div>
        </SettingsPageShell>
    );
}
