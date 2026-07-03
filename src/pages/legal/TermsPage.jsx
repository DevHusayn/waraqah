import PublicLegalPage from '../../components/legal/PublicLegalPage';
import { TERMS_SECTIONS, LEGAL_LAST_UPDATED } from '../../constants/legalContent';

export default function TermsPage() {
    return (
        <PublicLegalPage
            title="Terms and Conditions"
            subtitle="Terms of use for the Waraqah platform"
            sections={TERMS_SECTIONS}
            lastUpdated={LEGAL_LAST_UPDATED}
        />
    );
}
