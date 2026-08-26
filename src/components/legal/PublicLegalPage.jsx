import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import WaraqahLogo from '../WaraqahLogo';
import LegalDocument from './LegalDocument';

export default function PublicLegalPage({ title, subtitle, sections, lastUpdated }) {
    return (
        <div className="min-h-screen bg-surface-muted">
            <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 sm:py-14">
                <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground-muted hover:text-foreground mb-8 transition-colors"
                >
                    <ArrowLeft size={15} aria-hidden />
                    Back to home
                </Link>

                <div className="mb-8">
                    <WaraqahLogo size="md" />
                </div>

                <div className="rounded-xl border border-border/60 bg-surface shadow-soft p-6 sm:p-8">
                    <header className="mb-8 pb-6 border-b border-border/50">
                        <h1 className="page-title">{title}</h1>
                        {subtitle ? <p className="page-subtitle mt-1">{subtitle}</p> : null}
                    </header>

                    <LegalDocument sections={sections} lastUpdated={lastUpdated} />
                </div>

                <footer className="mt-8 text-center text-sm text-foreground-muted">
                    <Link to="/terms" className="hover:text-foreground transition-colors">
                        Terms
                    </Link>
                    <span className="mx-2" aria-hidden>
                        ·
                    </span>
                    <Link to="/privacy" className="hover:text-foreground transition-colors">
                        Privacy
                    </Link>
                </footer>
            </div>
        </div>
    );
}
