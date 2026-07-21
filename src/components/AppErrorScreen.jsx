import { Home, RotateCcw } from 'lucide-react';
import { APP_SUPPORT_EMAIL } from '../constants/brand';
import { getErrorState } from '../errors/errorStates';

/**
 * Shared full-page error UI. Pass an ERROR_STATES type (or a state object).
 */
export default function AppErrorScreen({
    type,
    state: stateProp,
    onReset,
    debugDetail = null,
    showHome = true,
}) {
    const state = stateProp || getErrorState(type);
    const Icon = state.Icon;

    return (
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md card text-center !p-8">
                <div
                    className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${state.iconWrapClassName}`}
                >
                    <Icon className={`h-6 w-6 ${state.iconClassName}`} aria-hidden />
                </div>
                <h1 className="text-lg font-semibold text-zinc-950">{state.title}</h1>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed">{state.description}</p>
                {debugDetail ? (
                    <p className="mt-2 text-xs text-zinc-400 font-mono break-words">{debugDetail}</p>
                ) : null}
                <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                    {onReset ? (
                        <button type="button" onClick={onReset} className="btn-secondary">
                            <RotateCcw size={16} />
                            Try again
                        </button>
                    ) : null}
                    {showHome ? (
                        <a href="/" className="btn-primary">
                            <Home size={16} />
                            Go home
                        </a>
                    ) : null}
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
