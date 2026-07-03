import PublicLegalPage from '../../components/legal/PublicLegalPage';
import { PRIVACY_SECTIONS, LEGAL_LAST_UPDATED } from '../../constants/legalContent';

export default function PrivacyPage() {
    return (
        <PublicLegalPage
            title="Privacy Policy"
            subtitle="How Waraqah collects, uses, and protects your data"
            sections={PRIVACY_SECTIONS}
            lastUpdated={LEGAL_LAST_UPDATED}
        />
    );
}
