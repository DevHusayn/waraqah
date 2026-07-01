import { useState } from 'react';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';

export default function NotificationSettings() {
    const { businessInfo, updateBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const enabled = Boolean(businessInfo.autoEmailInvoices);

    const handleToggle = async () => {
        setSaving(true);
        try {
            await updateBusinessInfo({ autoEmailInvoices: !enabled });
            showToast(
                !enabled
                    ? 'Clients will be emailed when invoices are finalized.'
                    : 'Automatic invoice emails turned off.',
                'success',
            );
        } catch (err) {
            showToast(err.message || 'Could not save notification settings.', 'error');
        } finally {
            setSaving(false);
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
            <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-1">
                        <h2 className="text-base font-semibold text-zinc-900">Email invoices to clients automatically</h2>
                        <p className="text-sm text-zinc-600 leading-relaxed max-w-xl">
                            When enabled, finalized invoices are emailed to the client as soon as they are created
                            or when a draft is finalized. You will still receive an owner notification for each send.
                            Manual &quot;Email to client&quot; always works regardless of this setting.
                        </p>
                    </div>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        disabled={saving}
                        onClick={handleToggle}
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
                <p className="mt-4 text-xs text-zinc-500">
                    {enabled ? 'Automatic client emails are on.' : 'Automatic client emails are off.'}
                </p>
            </div>
        </SettingsPageShell>
    );
}
