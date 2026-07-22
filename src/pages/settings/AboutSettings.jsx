import { Link } from 'react-router-dom';
import { ExternalLink, Facebook, Instagram, Linkedin } from 'lucide-react';
import SettingsPageShell from '../../components/settings/SettingsPageShell';
import {
    APP_NAME,
    APP_TAGLINE,
    APP_VERSION,
    APP_DESCRIPTION,
    APP_SUPPORT_EMAIL,
    APP_SOCIAL_LINKS,
} from '../../constants/brand';

const SOCIAL_ICONS = {
    instagram: Instagram,
    facebook: Facebook,
    linkedin: Linkedin,
};

function XIcon({ className }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="currentColor"
            aria-hidden
        >
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.227-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
        </svg>
    );
}

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
                    <div>
                        <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                            Follow us
                        </dt>
                        <dd className="mt-2 flex flex-wrap items-center gap-3">
                            {APP_SOCIAL_LINKS.map(({ id, label, url }) => {
                                const Icon = id === 'x' ? XIcon : SOCIAL_ICONS[id];
                                return (
                                    <a
                                        key={id}
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        className="inline-flex items-center text-brand hover:opacity-80 transition-opacity"
                                    >
                                        {Icon ? <Icon className="h-5 w-5" aria-hidden /> : null}
                                    </a>
                                );
                            })}
                        </dd>
                    </div>
                </dl>
            </div>
        </SettingsPageShell>
    );
}
