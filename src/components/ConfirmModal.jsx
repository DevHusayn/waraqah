import { AlertTriangle, Loader2 } from 'lucide-react';
import ModalShell from './ModalShell';

export default function ConfirmModal({
    open,
    onConfirm,
    onCancel,
    message,
    title = 'Confirm action',
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    loading = false,
}) {
    const isDanger = variant === 'danger';

    return (
        <ModalShell
            open={open}
            onClose={loading ? undefined : onCancel}
            size="sm"
            ariaLabelledby="confirm-modal-title"
            ariaDescribedby="confirm-modal-message"
        >
            <div className="p-6 sm:p-8">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                    <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl mb-4 ${
                            isDanger ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}
                    >
                        <AlertTriangle size={22} aria-hidden />
                    </div>
                    <h2 id="confirm-modal-title" className="text-lg font-semibold text-slate-900">
                        {title}
                    </h2>
                    <p
                        id="confirm-modal-message"
                        className="mt-2 text-sm text-slate-600 leading-relaxed"
                    >
                        {description || message || 'Are you sure you want to continue?'}
                    </p>
                </div>

                <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                        type="button"
                        className="btn-secondary flex-1"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`flex-1 flex items-center justify-center gap-2 font-medium py-2.5 px-5 rounded-xl transition-colors disabled:opacity-60 ${
                            isDanger
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'btn-primary'
                        }`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" aria-hidden />
                                Please wait…
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
