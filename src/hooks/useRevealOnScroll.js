import { useEffect, useRef, useState } from 'react';

/** Adds `landing-visible` when element enters viewport (for CSS animations). */
export function useRevealOnScroll(options = {}) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    if (options.once !== false) observer.disconnect();
                }
            },
            { threshold: options.threshold ?? 0.12, rootMargin: options.rootMargin ?? '0px 0px -40px 0px' }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [options.threshold, options.rootMargin, options.once]);

    return [ref, visible];
}

export function revealClass(visible, delay = 0) {
    return `landing-reveal ${visible ? 'landing-visible' : ''}`.trim() + (delay ? ` landing-delay-${delay}` : '');
}
