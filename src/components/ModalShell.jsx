import { useEffect } from 'react';
import { X } from 'lucide-react';

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
}) {
    useEffect(() => {
        if (!open) return undefined;

        const scrollY = window.scrollY;
        const { style } = document.body;
        const prev = {
            position: style.position,
            top: style.top,
            left: style.left,
            right: style.right,
            overflow: style.overflow,
            width: style.width,
        };

        style.position = 'fixed';
        style.top = `-${scrollY}px`;
        style.left = '0';
        style.right = '0';
        style.width = '100%';
        style.overflow = 'hidden';

        const onKeyDown = (e) => {
            if (e.key === 'Escape' && onClose) {
                onClose();
            }
        };
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('keydown', onKeyDown);
            style.position = prev.position;
            style.top = prev.top;
            style.left = prev.left;
            style.right = prev.right;
            style.width = prev.width;
            style.overflow = prev.overflow;
            window.scrollTo(0, scrollY);
        };
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
                className={`relative w-full ${sizes[size] || sizes.sm} bg-white rounded-lg border border-zinc-200/80 shadow-card-md animate-modal-scale max-h-[min(90vh,100%)] overflow-y-auto ${panelClassName}`}
            >
                {showClose && onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors z-10"
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
