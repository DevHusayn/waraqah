import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { APP_NAME, APP_SUPPORT_EMAIL } from '../constants/brand';

export default function ErrorFallback({ error, onReset }) {
    const message =
        import.meta.env.DEV && error?.message
            ? error.message
            : 'Something went wrong while loading this page.';

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md card text-center !p-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-200/80 bg-red-50">
                    <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden />
                </div>
                <h1 className="text-lg font-semibold text-zinc-950">Unexpected error</h1>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{message}</p>
                <p className="mt-1 text-xs text-zinc-400">
                    {APP_NAME} hit a problem. You can try again or return home.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                    {onReset ? (
                        <button type="button" onClick={onReset} className="btn-secondary">
                            <RotateCcw size={16} />
                            Try again
                        </button>
                    ) : null}
                    <a href="/" className="btn-primary">
                        <Home size={16} />
                        Go home
                    </a>
                </div>
                {APP_SUPPORT_EMAIL ? (
                    <p className="mt-5 text-xs text-zinc-400">
                        Need help?{' '}
                        <a href={`mailto:${APP_SUPPORT_EMAIL}`} className="text-brand hover:underline">
                            {APP_SUPPORT_EMAIL}
                        </a>
                    </p>
                ) : null}
            </div>
        </div>
    );
}
