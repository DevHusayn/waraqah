import SettingsPageShell from '../../components/settings/SettingsPageShell';
import LegalDocument from '../../components/legal/LegalDocument';
import { APP_DOMAIN } from '../../constants/brand';
import { PRIVACY_SECTIONS, LEGAL_LAST_UPDATED } from '../../constants/legalContent';
import { PRIVACY_PATH } from '../../constants/legalRoutes';

export default function PrivacySettings() {
    return (
        <SettingsPageShell
            title="Privacy Policy"
            subtitle="How Waraqah collects, uses, and protects your data"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Privacy Policy', to: '/settings/privacy' },
            ]}
        >
            <div className="card space-y-6">
                <p className="text-sm text-zinc-500">
                    Public version also available at{' '}
                    <a href={PRIVACY_PATH} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                        {APP_DOMAIN}{PRIVACY_PATH}
                    </a>
                </p>
                <LegalDocument sections={PRIVACY_SECTIONS} lastUpdated={LEGAL_LAST_UPDATED} />
            </div>
        </SettingsPageShell>
    );
}
