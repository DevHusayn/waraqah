import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import ModalShell from './ModalShell';

const VARIANTS = {
    error: {
        icon: AlertCircle,
        iconWrap: 'bg-red-50 text-red-600',
        titleClass: 'text-zinc-950',
        messageClass: 'text-zinc-500',
        buttonClass: 'btn-primary',
    },
    success: {
        icon: CheckCircle2,
        iconWrap: 'bg-green-50 text-green-600',
        titleClass: 'text-zinc-950',
        messageClass: 'text-zinc-500',
        buttonClass: 'btn-primary',
    },
    info: {
        icon: Info,
        iconWrap: 'bg-zinc-100 text-zinc-600',
        titleClass: 'text-zinc-950',
        messageClass: 'text-zinc-500',
        buttonClass: 'btn-primary',
    },
};

export default function AlertModal({
    open,
    onClose,
    message,
    title,
    type = 'error',
    buttonLabel = 'OK',
}) {
    const variant = VARIANTS[type] || VARIANTS.error;
    const Icon = variant.icon;
    const displayTitle =
        title ||
        (type === 'success' ? 'Success' : type === 'info' ? 'Notice' : 'Something went wrong');

    return (
        <ModalShell
            open={open}
            onClose={onClose}
            size="sm"
            ariaLabelledby="alert-modal-title"
            ariaDescribedby="alert-modal-message"
            role="alertdialog"
        >
            <div className="p-5 sm:p-6">
                <div className="flex flex-col items-center text-center">
                    <div
                        className={`flex h-9 w-9 items-center justify-center rounded-md mb-3 ${variant.iconWrap}`}
                    >
                        <Icon size={18} aria-hidden />
                    </div>
                    <h2
                        id="alert-modal-title"
                        className={`text-base font-semibold ${variant.titleClass}`}
                    >
                        {displayTitle}
                    </h2>
                    <p
                        id="alert-modal-message"
                        className={`mt-2 text-sm leading-relaxed whitespace-pre-line ${variant.messageClass}`}
                    >
                        {message ||
                            (type === 'success'
                                ? 'Your action completed successfully.'
                                : 'Please try again.')}
                    </p>
                </div>
                <div className="mt-6">
                    <button
                        type="button"
                        className={`w-full ${variant.buttonClass}`}
                        onClick={onClose}
                    >
                        {buttonLabel}
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
