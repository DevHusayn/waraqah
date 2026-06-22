import { Share2 } from 'lucide-react';
import ModalShell from './ModalShell';

const modalBtn =
    'w-full text-sm py-2 px-3 gap-1.5 whitespace-nowrap min-h-[40px]';

export default function ShareDocumentModal({
    open,
    docLabel = 'invoice',
    docNumber,
    clientName,
    shareReady = true,
    onShare,
    onSkip,
}) {
    return (
        <ModalShell
            open={open}
            onClose={onSkip}
            size="sm"
            ariaLabelledby="share-doc-modal-title"
            ariaDescribedby="share-doc-modal-message"
        >
            <div className="p-5 sm:p-6">
                <div className="text-center sm:text-left">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg mb-3 mx-auto sm:mx-0 bg-brand-subtle text-brand">
                        <Share2 size={18} aria-hidden />
                    </div>
                    <h2 id="share-doc-modal-title" className="text-base font-semibold text-zinc-900">
                        Invoice ready to share
                    </h2>
                    <p id="share-doc-modal-message" className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                        {docNumber ? (
                            <span className="font-medium text-zinc-900">{docNumber}</span>
                        ) : (
                            'Your invoice'
                        )}
                        {clientName ? ` for ${clientName}` : ''} has been saved.
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 w-full">
                    <button
                        type="button"
                        className={`btn-primary ${modalBtn} disabled:opacity-60`}
                        onClick={onShare}
                        disabled={!shareReady}
                        autoFocus
                    >
                        <Share2 size={16} className="shrink-0" aria-hidden />
                        Share {docLabel}
                    </button>
                    <button
                        type="button"
                        className={`btn-secondary ${modalBtn}`}
                        onClick={onSkip}
                    >
                        Skip for now
                    </button>
                </div>
            </div>
        </ModalShell>
    );
}
