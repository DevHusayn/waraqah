import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import ModalShell from './ModalShell';

const VARIANTS = {
    error: {
        icon: AlertCircle,
        iconWrap: 'bg-red-100 text-red-600',
        titleClass: 'text-slate-900',
        messageClass: 'text-slate-600',
        buttonClass: 'btn-primary',
    },
    success: {
        icon: CheckCircle2,
        iconWrap: 'bg-emerald-100 text-emerald-600',
        titleClass: 'text-slate-900',
        messageClass: 'text-slate-600',
        buttonClass: 'bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-5 rounded-xl transition-colors',
    },
    info: {
        icon: Info,
        iconWrap: 'bg-brand-light text-brand',
        titleClass: 'text-slate-900',
        messageClass: 'text-slate-600',
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
            <div className="p-6 sm:p-8">
                <div className="flex flex-col items-center text-center">
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl mb-4 ${variant.iconWrap}`}
                    >
                        <Icon size={24} aria-hidden />
                    </div>
                    <h2
                        id="alert-modal-title"
                        className={`text-lg font-semibold ${variant.titleClass}`}
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
