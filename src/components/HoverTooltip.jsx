import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function HoverTooltip({ label, enabled = true, children }) {
    const [pos, setPos] = useState(null);

    const hide = useCallback(() => setPos(null), []);

    const show = useCallback(
        (event) => {
            if (!enabled || !label) return;
            const rect = event.currentTarget.getBoundingClientRect();
            setPos({
                top: rect.top + rect.height / 2,
                left: rect.right + 10,
            });
        },
        [enabled, label],
    );

    useEffect(() => {
        if (!pos) return undefined;
        window.addEventListener('scroll', hide, true);
        window.addEventListener('resize', hide);
        return () => {
            window.removeEventListener('scroll', hide, true);
            window.removeEventListener('resize', hide);
        };
    }, [pos, hide]);

    if (!enabled) return children;

    return (
        <div className="min-w-0" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={hide}>
            {children}
            {pos
                ? createPortal(
                    <span
                        role="tooltip"
                        aria-hidden
                        className="pointer-events-none fixed z-[80] -translate-y-1/2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-[12px] font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900"
                        style={{ top: pos.top, left: pos.left }}
                    >
                        {label}
                    </span>,
                    document.body,
                )
                : null}
        </div>
    );
}
