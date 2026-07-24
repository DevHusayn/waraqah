import SettingsPageShell from '../../components/settings/SettingsPageShell';
import LegalDocument from '../../components/legal/LegalDocument';
import { APP_DOMAIN } from '../../constants/brand';
import { TERMS_SECTIONS, LEGAL_LAST_UPDATED } from '../../constants/legalContent';
import { TERMS_PATH } from '../../constants/legalRoutes';

export default function TermsSettings() {
    return (
        <SettingsPageShell
            title="Terms and Conditions"
            subtitle="Terms of use for the Waraqah platform"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'Terms and Conditions', to: '/settings/terms' },
            ]}
        >
            <div className="card space-y-6">
                <p className="text-sm text-zinc-500">
                    Public version also available at{' '}
                    <a href={TERMS_PATH} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                        {APP_DOMAIN}{TERMS_PATH}
                    </a>
                </p>
                <LegalDocument sections={TERMS_SECTIONS} lastUpdated={LEGAL_LAST_UPDATED} />
            </div>
        </SettingsPageShell>
    );
}
