import { CheckCircle, X, XCircle, AlertCircle } from 'lucide-react';

const icons = {
    success: CheckCircle,
    error: XCircle,
    info: AlertCircle,
};

const styles = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-800/60 dark:text-green-300',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800/60 dark:text-red-300',
    info: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950/50 dark:border-green-800/60 dark:text-green-300',
};

const iconStyles = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-500 dark:text-red-400',
    info: 'text-green-600 dark:text-green-400',
};

export default function ToastContainer({ toasts, onDismiss }) {
    if (!toasts.length) return null;

    return (
        <div
            className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 sm:w-auto"
            aria-live="polite"
        >
            {toasts.map((toast) => {
                const Icon = icons[toast.type] || icons.info;
                return (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-start gap-3 rounded-xl border shadow-card px-4 py-3 animate-toast-in ${styles[toast.type] || styles.info}`}
                        role="status"
                    >
                        <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconStyles[toast.type] || iconStyles.info}`} />
                        <p className="text-sm font-medium flex-1">{toast.message}</p>
                        <button
                            type="button"
                            onClick={() => onDismiss(toast.id)}
                            className="flex-shrink-0 opacity-60 hover:opacity-100 transition"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
