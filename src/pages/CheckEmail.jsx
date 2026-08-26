import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import WaraqahLogo from '../components/WaraqahLogo';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch, authFetch } from '../utils/api';
import { AUTH_LOGIN_PATH } from '../constants/authRoutes';

export default function CheckEmailPage() {
    const [searchParams] = useSearchParams();
    const { user, refreshSession } = useAuth();
    const { showToast } = useToast();
    const [sending, setSending] = useState(false);

    const email = user?.email || searchParams.get('email') || '';
    const message = searchParams.get('message') || '';

    const handleResend = async () => {
        setSending(true);
        try {
            if (user?.emailVerified === false) {
                await apiFetch('/auth/resend-verification', { method: 'POST' });
            } else if (email) {
                await authFetch('/auth/resend-verification-email', {
                    method: 'POST',
                    body: JSON.stringify({ email }),
                });
            } else {
                throw new Error('Enter your email on the sign-in page to request a new link.');
            }
            showToast('Verification email sent. Check your inbox.', 'success');
            await refreshSession();
        } catch (err) {
            showToast(err.message || 'Could not send verification email.', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-muted/80 flex flex-col">
            <div className="flex-1 flex flex-col justify-center px-5 py-8 sm:px-8">
                <div className="w-full max-w-[420px] mx-auto">
                    <Link
                        to={AUTH_LOGIN_PATH}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-foreground-muted hover:text-foreground mb-6 transition-colors"
                    >
                        <ArrowLeft size={15} aria-hidden />
                        Back to sign in
                    </Link>

                    <div className="mb-6">
                        <WaraqahLogo size="md" />
                    </div>

                    <div className="rounded-xl border border-border/60 bg-surface shadow-soft p-6 sm:p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand">
                            <Mail size={22} aria-hidden />
                        </div>
                        <h1 className="text-xl font-semibold text-foreground">Check your email</h1>
                        {message ? (
                            <p className="mt-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
                                {message}
                            </p>
                        ) : null}
                        <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
                            We sent a verification link to{' '}
                            {email ? (
                                <span className="font-medium text-foreground">{email}</span>
                            ) : (
                                'your email address'
                            )}
                            . Open the link to activate your account, then sign in.
                        </p>

                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={sending || !email}
                            className="btn-secondary w-full mt-6"
                        >
                            {sending ? 'Sending…' : 'Resend verification email'}
                        </button>

                        <Link
                            to={AUTH_LOGIN_PATH}
                            className="btn-primary w-full mt-3 inline-flex justify-center"
                        >
                            Go to sign in
                        </Link>

                        <p className="mt-5 text-xs text-foreground-muted">
                            Didn&apos;t get it? Check spam, or wait a few minutes before resending.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
