import { useState } from 'react';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiFetch } from '../utils/api';

export default function EmailVerificationBanner() {
    const { user, refreshSession } = useAuth();
    const { showToast } = useToast();
    const [sending, setSending] = useState(false);

    if (!user || user.emailVerified !== false) {
        return null;
    }

    const handleResend = async () => {
        setSending(true);
        try {
            await apiFetch('/auth/resend-verification', { method: 'POST' });
            showToast('Verification email sent. Check your inbox.', 'success');
            await refreshSession();
        } catch (err) {
            showToast(err.message || 'Could not send verification email.', 'error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
                <Mail size={18} className="text-amber-700 shrink-0 mt-0.5" aria-hidden />
                <div>
                    <p className="text-sm font-medium text-amber-900">Verify your email address</p>
                    <p className="text-sm text-amber-800/90 mt-0.5">
                        We sent a link to <span className="font-medium">{user.email}</span>. Verify to secure your account.
                    </p>
                </div>
            </div>
            <button
                type="button"
                onClick={handleResend}
                disabled={sending}
                className="btn-secondary text-sm py-2 px-4 shrink-0 self-start sm:self-auto"
            >
                {sending ? 'Sending…' : 'Resend email'}
            </button>
        </div>
    );
}
