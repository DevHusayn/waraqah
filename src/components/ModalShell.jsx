import { useEffect } from 'react';
import { X } from 'lucide-react';
import { lockBodyScroll } from '../utils/bodyScrollLock';

/**
 * Shared modal backdrop + panel. Locks body scroll while open.
 */
export default function ModalShell({
    open,
    onClose,
    children,
    className = '',
    panelClassName = '',
    ariaLabelledby,
    ariaDescribedby,
    role = 'dialog',
    showClose = false,
    size = 'sm',
    scrollable = true,
}) {
    useEffect(() => {
        if (!open) return undefined;
        return lockBodyScroll();
    }, [open]);

    useEffect(() => {
        if (!open || !onClose) return undefined;

        const onKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
    };

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${className}`}
            role="presentation"
        >
            <button
                type="button"
                className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
                aria-label="Close dialog"
                onClick={onClose}
            />
            <div
                role={role}
                aria-modal="true"
                aria-labelledby={ariaLabelledby}
                aria-describedby={ariaDescribedby}
                className={`relative w-full ${sizes[size] || sizes.sm} bg-surface rounded-lg border border-border/60 shadow-lift animate-modal-scale ${
                    scrollable ? 'max-h-[min(90vh,100%)] overflow-y-auto' : 'overflow-visible'
                } ${panelClassName}`}
            >
                {showClose && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-md text-foreground-muted hover:text-foreground hover:bg-surface-muted transition-colors z-10"
                        aria-label="Close"
                    >
                        <X size={18} aria-hidden />
                    </button>
                )}
                {children}
            </div>
        </div>
    );
}
