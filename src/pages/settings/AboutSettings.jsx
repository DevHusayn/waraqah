import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import {
    APP_NAME,
    APP_TAGLINE,
    APP_VERSION,
    APP_DESCRIPTION,
    APP_SUPPORT_EMAIL,
} from '../../constants/brand';

export default function AboutSettings() {
    return (
        <SettingsPageShell
            title="About"
            subtitle="Product information and support"
            backTo="/settings"
            backLabel="Settings"
            breadcrumbs={[
                { label: 'Settings', to: '/settings' },
                { label: 'About', to: '/settings/about' },
            ]}
        >
            <div className="card space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-900">{APP_NAME}</h2>
                    <p className="text-sm text-zinc-500 mt-1">{APP_TAGLINE}</p>
                    <p className="text-xs text-zinc-400 mt-2">Version {APP_VERSION}</p>
                </div>

                <p className="text-sm text-zinc-600 leading-relaxed">{APP_DESCRIPTION}</p>

                <dl className="space-y-4 text-sm">
                    <div>
                        <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                            Support
                        </dt>
                        <dd className="mt-1">
                            <a
                                href={`mailto:${APP_SUPPORT_EMAIL}`}
                                className="text-brand hover:underline font-medium"
                            >
                                {APP_SUPPORT_EMAIL}
                            </a>
                        </dd>
                    </div>
                    <div>
                        <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                            Website
                        </dt>
                        <dd className="mt-1">
                            <Link
                                to="/"
                                className="inline-flex items-center gap-1.5 text-brand hover:underline font-medium"
                            >
                                waraqah.com
                                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                        </dd>
                    </div>
                </dl>
            </div>
        </SettingsPageShell>
    );
}
