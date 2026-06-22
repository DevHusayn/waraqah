import SettingsListGroup from '../../components/settings/SettingsListGroup';
import SettingsListItem from '../../components/settings/SettingsListItem';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import BusinessSummaryCard from '../../components/settings/BusinessSummaryCard';
import { useSettings } from '../../context/SettingsContext';
import { SETTINGS_INDEX } from '../../constants/settingsNav';

export default function SettingsIndex() {
    const { businessInfo } = useSettings();

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
        </SettingsPageShell>
    );
}
