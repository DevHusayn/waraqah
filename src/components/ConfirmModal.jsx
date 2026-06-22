import { AlertTriangle } from 'lucide-react';
import ModalShell from './ModalShell';
import Spinner from './Spinner';

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
            <div className="p-5 sm:p-6">
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-md mb-3 ${
                            isDanger ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600'
                        }`}
                    >
                        <AlertTriangle size={18} aria-hidden />
                    </div>
                    <h2 id="confirm-modal-title" className="text-base font-semibold text-zinc-950">
                        {title}
                    </h2>
                    <p
                        id="confirm-modal-message"
                        className="mt-1.5 text-sm text-zinc-500 leading-relaxed"
                    >
                        {description || message || 'Are you sure you want to continue?'}
                    </p>
                </div>

                <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2">
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
                        className={`flex-1 ${isDanger ? 'btn-danger' : 'btn-primary'}`}
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner size="sm" inline />
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
