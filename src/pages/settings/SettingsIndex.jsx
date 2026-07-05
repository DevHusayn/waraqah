import { useState } from 'react';
import { LogOut } from 'lucide-react';
import SettingsListGroup from '../../components/settings/SettingsListGroup';
import SettingsListItem from '../../components/settings/SettingsListItem';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import BusinessSummaryCard from '../../components/settings/BusinessSummaryCard';
import ConfirmModal from '../../components/ConfirmModal';
import { useSettings } from '../../context/SettingsContext';
import { SETTINGS_INDEX } from '../../constants/settingsNav';
import useAppLogout from '../../hooks/useAppLogout';

export default function SettingsIndex() {
    const { businessInfo } = useSettings();
    const handleLogout = useAppLogout();
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    return (
        <SettingsPageShell
            title="Settings"
            subtitle="Manage your business, subscription, and account preferences"
        >
            <BusinessSummaryCard businessInfo={businessInfo} className="mb-6" />

            <SettingsListGroup label="General">
                {SETTINGS_INDEX.map((item) => (
                    <SettingsListItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                    />
                ))}
            </SettingsListGroup>

            <SettingsListGroup label="Account" className="mt-6">
                <button
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="flex w-full items-center gap-3 px-4 py-3.5 bg-white hover:bg-red-50/80 transition-colors group first:rounded-t-lg last:rounded-b-lg text-left"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-200/60 bg-red-50 text-red-600 group-hover:border-red-300 transition-colors">
                        <LogOut className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-red-600">Log out</span>
                        <span className="block text-[13px] text-red-500/80 mt-0.5 leading-snug">
                            Sign out of your account on this device
                        </span>
                    </span>
                </button>
            </SettingsListGroup>

            <ConfirmModal
                open={showLogoutModal}
                title="Log out?"
                description="You will need to sign in again to access your account."
                confirmLabel="Log out"
                cancelLabel="Stay signed in"
                variant="danger"
                onConfirm={() => {
                    setShowLogoutModal(false);
                    handleLogout();
                }}
                onCancel={() => setShowLogoutModal(false)}
            />
        </SettingsPageShell>
    );
}
