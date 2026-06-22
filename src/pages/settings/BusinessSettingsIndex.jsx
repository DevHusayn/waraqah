import SettingsListGroup from '../../components/settings/SettingsListGroup';
import SettingsListItem from '../../components/settings/SettingsListItem';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import BusinessSummaryCard from '../../components/settings/BusinessSummaryCard';
import { useSettings } from '../../context/SettingsContext';
import { BUSINESS_SETTINGS_INDEX } from '../../constants/settingsNav';

export default function BusinessSettingsIndex() {
    const { businessInfo } = useSettings();

    return (
        <SettingsPageShell
            title="Business Settings"
            subtitle="Company information and visual identity"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Business Settings', to: '/settings/business' },
            ]}
        >
            <BusinessSummaryCard businessInfo={businessInfo} className="mb-6" />

            <SettingsListGroup label="Business">
                {BUSINESS_SETTINGS_INDEX.map((item) => (
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
