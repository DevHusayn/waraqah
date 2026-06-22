import SettingsPageShell from '../../components/settings/SettingsPageShell';
import { APP_NAME } from '../../constants/brand';

const TERMS_SECTIONS = [
    {
        title: 'Acceptance of terms',
        body: `By accessing or using ${APP_NAME}, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the service.`,
    },
    {
        title: 'Service description',
        body: `${APP_NAME} provides invoicing, client management, and related business tools. Features may change as the product evolves. We strive to maintain reliable service but do not guarantee uninterrupted availability.`,
    },
    {
        title: 'Accounts and security',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account. Notify us promptly of any unauthorized use.',
    },
    {
        title: 'Billing and subscriptions',
        body: 'Paid plans are billed according to the pricing shown at checkout. Subscriptions renew automatically unless cancelled before the renewal date. Refunds are handled in accordance with applicable payment provider policies.',
    },
    {
        title: 'Acceptable use',
        body: 'You agree not to misuse the platform, including attempting to access other users\' data, distributing malware, or using the service for unlawful purposes.',
    },
    {
        title: 'Limitation of liability',
        body: `${APP_NAME} is provided "as is" to the fullest extent permitted by law. We are not liable for indirect, incidental, or consequential damages arising from your use of the service.`,
    },
    {
        title: 'Changes to these terms',
        body: 'We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the revised terms.',
    },
    {
        title: 'Contact',
        body: 'Questions about these terms may be directed to support@waraqah.com.',
    },
];

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
            <div className="card space-y-8">
                <p className="text-sm text-zinc-500">Last updated: June 22, 2026</p>
                {TERMS_SECTIONS.map((section) => (
                    <section key={section.title}>
                        <h2 className="text-base font-semibold text-zinc-900">{section.title}</h2>
                        <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{section.body}</p>
                    </section>
                ))}
            </div>
        </SettingsPageShell>
    );
}
