import { useEffect, useState } from 'react';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { isPremiumUser } from '../../utils/premium';
import {
    isAutoPaymentRemindersEnabled,
    isAutoMonthlyStatementsEnabled,
    isLowStockEmailAlertsEnabled,
} from '@waraqah/shared';
import {
    enableDevicePush,
    syncDeviceSubscription,
    isIosDevice,
    isPushSupported,
    isStandalonePwa,
    unsubscribeThisDevice,
} from '../../utils/pushNotifications';

function NotificationToggle({
    title,
    description,
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
    const [devicePushOn, setDevicePushOn] = useState(false);
    const [savingDevicePush, setSavingDevicePush] = useState(false);

    useEffect(() => {
        let cancelled = false;
        syncDeviceSubscription()
            .then((subscribed) => {
                if (!cancelled) setDevicePushOn(subscribed);
            })
            .catch(() => {
                if (!cancelled) setDevicePushOn(false);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const premium = isPremiumUser(businessInfo);
    const invoiceEmailsEnabled = businessInfo.autoEmailInvoices !== false;
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
                    ? 'Daily stock email alerts are on.'
                    : 'Stock email alerts turned off.',
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

    const handleDevicePushToggle = async () => {
        setSavingDevicePush(true);
        try {
            if (devicePushOn) {
                await unsubscribeThisDevice();
                setDevicePushOn(false);
                showToast('This device will no longer get briefings.', 'success');
            } else {
                await enableDevicePush();
                setDevicePushOn(true);
                showToast('This device will get a morning briefing.', 'success');
            }
        } catch (err) {
            showToast(err.message || 'Could not update notifications for this device.', 'error');
        } finally {
            setSavingDevicePush(false);
        }
    };

    let deviceDescription = 'Briefings, payment alerts, and occasional product updates on this device.';
    if (!isPushSupported()) {
        deviceDescription = 'This browser cannot receive push notifications.';
    } else if (isIosDevice() && !isStandalonePwa()) {
        deviceDescription = 'Install Waraqah to your Home Screen, then turn this on.';
    } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        deviceDescription = 'Notifications are blocked in the browser settings.';
    }

    return (
        <SettingsPageShell
            title="Notifications"
            subtitle="Emails for you and your clients, plus a morning briefing on this device"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Notifications', to: '/settings/notifications' },
            ]}
        >
            <div className="space-y-6">
                <NotificationToggle
                    title="Notify this device"
                    description={deviceDescription}
                    enabled={devicePushOn}
                    saving={savingDevicePush || !isPushSupported()}
                    onToggle={handleDevicePushToggle}
                />

                <NotificationToggle
                    title="Email invoices to clients automatically"
                    description="Email the client when an invoice is finalized."
                    enabled={invoiceEmailsEnabled}
                    saving={savingInvoiceEmails}
                    onToggle={handleInvoiceEmailToggle}
                />

                <NotificationToggle
                    title="Send payment reminders automatically"
                    description="Email the client when an invoice is due or overdue."
                    enabled={reminderEmailsEnabled}
                    saving={savingReminderEmails}
                    onToggle={handleReminderEmailToggle}
                />

                <NotificationToggle
                    title="Email me when products are low or out of stock"
                    description="A daily email when tracked products are low or out of stock."
                    enabled={lowStockEmailsEnabled}
                    saving={savingLowStockEmails}
                    onToggle={handleLowStockEmailToggle}
                />

                {premium ? (
                    <NotificationToggle
                        title="Email me my monthly billing statement"
                        description="A PDF of last month, emailed on the 1st."
                        enabled={monthlyStatementsEnabled}
                        saving={savingMonthlyStatements}
                        onToggle={handleMonthlyStatementToggle}
                    />
                ) : null}
            </div>
        </SettingsPageShell>
    );
}
