import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import Spinner from './Spinner';
import ModalShell from './ModalShell';
import FieldValidationMessage from './FieldValidationMessage';
import { validateEmail, inputClass } from '../utils/formFieldValidation';

export default function ForgotPasswordModal({ open, onClose, onSubmit, loading = false }) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setEmail('');
            setError('');
        }
    }, [open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const emailError = validateEmail(
            email,
            'Please enter your email address.',
            'Please enter a valid email address.'
        );
        if (emailError) {
            setError(emailError);
            return;
        }
        onSubmit(email.trim().toLowerCase());
    };

    return (
        <ModalShell
            open={open}
            onClose={loading ? undefined : onClose}
            size="md"
            showClose
            ariaLabelledby="forgot-password-title"
        >
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-brand-subtle shrink-0">
                        <KeyRound className="h-5 w-5 text-brand" aria-hidden />
                    </div>
                    <div>
                        <h2 id="forgot-password-title" className="text-lg font-semibold text-zinc-900">
                            Reset password
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            We&apos;ll email you a link to choose a new password
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5">
                <div>
                    <label htmlFor="reset-email" className="label">
                        Email address
                    </label>
                    <input
                        id="reset-email"
                        type="email"
                        className={inputClass(Boolean(error))}
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) setError('');
                        }}
                        autoComplete="email"
                        aria-invalid={Boolean(error)}
                    />
                    <FieldValidationMessage message={error} />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                    {loading ? (
                        <>
                            <Spinner size="sm" inline />
                            Sending link…
                        </>
                    ) : (
                        'Send reset link'
                    )}
                </button>
            </form>
        </ModalShell>
    );
}
