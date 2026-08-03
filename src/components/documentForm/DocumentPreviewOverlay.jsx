import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import InvoiceDocumentPreview from '../InvoiceDocumentPreview';
import Spinner from '../Spinner';
import { lockBodyScroll } from '../../utils/bodyScrollLock';

export default function DocumentPreviewOverlay({
    open,
    onClose,
    onSend,
    sendLabel,
    sendReady,
    sending,
    invoice,
    client,
    businessInfo,
    mode = 'invoice',
}) {
    useEffect(() => {
        if (!open) return undefined;
        return lockBodyScroll();
    }, [open]);

    useEffect(() => {
        if (!open || !onClose) return undefined;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9998]" role="presentation">
            <button
                type="button"
                className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[1px] animate-fade-in"
                aria-label="Close preview"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Document preview"
                className="absolute inset-0 z-[9999] flex flex-col bg-white animate-sheet-up min-h-[100dvh]"
            >
                <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200/60 bg-white">
                    <h2 className="text-base font-semibold text-zinc-900">Preview</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} aria-hidden />
                    </button>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto bg-stone-50 px-3 sm:px-4 py-4">
                    <div className="max-w-3xl mx-auto">
                        <div className="card !p-0 overflow-hidden shadow-card border border-zinc-200">
                            <InvoiceDocumentPreview
                                invoice={invoice}
                                client={client}
                                businessInfo={businessInfo}
                                mode={mode}
                            />
                        </div>
                    </div>
                </div>

                <footer className="shrink-0 border-t border-zinc-200/60 bg-white/95 backdrop-blur-sm px-4 py-3 safe-area-pb">
                    <div className="max-w-3xl mx-auto grid grid-cols-2 gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary w-full text-sm py-2.5 px-4 min-h-[44px]"
                        >
                            Back to edit
                        </button>
                        <button
                            type="button"
                            onClick={onSend}
                            className="btn-primary w-full text-sm py-2.5 px-4 min-h-[44px] disabled:opacity-60"
                            disabled={!sendReady || sending}
                        >
                            {sending ? (
                                <>
                                    <Spinner size="sm" inline />
                                    Saving…
                                </>
                            ) : (
                                sendLabel
                            )}
                        </button>
                    </div>
                </footer>
            </div>
        </div>,
        document.body
    );
}
