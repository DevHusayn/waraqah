import { useState } from 'react';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import { useSettings } from '../../context/SettingsContext';
import { useToast } from '../../context/ToastContext';
import { isOversellingAllowed } from '@waraqah/shared';

function InventoryToggle({
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

export default function InventorySettings() {
    const { businessInfo, updateBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);

    const oversellingEnabled = isOversellingAllowed(businessInfo);

    const handleToggle = async () => {
        setSaving(true);
        try {
            await updateBusinessInfo({ allowOverselling: !oversellingEnabled });
            showToast(
                !oversellingEnabled
                    ? 'Overselling is allowed — stock can go below zero.'
                    : 'Overselling is blocked — documents cannot exceed available stock.',
                'success',
            );
        } catch (err) {
            showToast(err.message || 'Could not save inventory settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SettingsPageShell
            title="Inventory"
            subtitle="Control how tracked product stock is handled when you issue documents"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Inventory', to: '/settings/inventory' },
            ]}
        >
            <div className="space-y-6">
                <InventoryToggle
                    title="Allow overselling"
                    description={
                        'When enabled, you can issue invoices and receipts even when a catalog product '
                        + 'does not have enough stock on hand. Stock can go negative and you will see a warning. '
                        + 'When off, Waraqah blocks the save and asks you to reduce quantities or add stock first.'
                    }
                    statusText={
                        oversellingEnabled
                            ? 'Overselling is allowed. Stock can go below zero.'
                            : 'Overselling is blocked. Available stock is enforced on issue.'
                    }
                    enabled={oversellingEnabled}
                    saving={saving}
                    onToggle={handleToggle}
                />
            </div>
        </SettingsPageShell>
    );
}
