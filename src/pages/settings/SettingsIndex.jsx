import SettingsListGroup from '../../components/settings/SettingsListGroup';
import SettingsListItem from '../../components/settings/SettingsListItem';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import AppearanceSettings from '../../components/settings/AppearanceSettings';
import BusinessSummaryCard from '../../components/settings/BusinessSummaryCard';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { SETTINGS_INDEX } from '../../constants/settingsNav';

export default function SettingsIndex() {
    const { user } = useAuth();
    const { businessInfo } = useSettings();
    const usesGoogle = (user?.authProvider || 'local') === 'google';
    const items = SETTINGS_INDEX.filter((item) => !(item.hideForGoogle && usesGoogle));

    return (
        <SettingsPageShell
            title="Settings"
            subtitle="Manage your business, subscription, and account preferences"
        >
            <BusinessSummaryCard businessInfo={businessInfo} className="mb-6" />

            <SettingsListGroup label="General" className="mb-6">
                <AppearanceSettings />
            </SettingsListGroup>

            <SettingsListGroup label="Account">
                {items.map((item) => (
                    <SettingsListItem
                        key={item.to}
                        to={item.to}
                        icon={item.icon}
                        title={item.title}
                        description={item.description}
                    />
                ))}
            </SettingsListGroup>
        </SettingsPageShell>
    );
}
