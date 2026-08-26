import { useCallback, useEffect, useRef } from 'react';

const AUTO_SCROLL_SPEED = 0.5;
const RESUME_DELAY_MS = 900;

function normalizeScrollLeft(scroller) {
    const half = scroller.scrollWidth / 2;
    if (half <= 0) return;
    if (scroller.scrollLeft >= half) {
        scroller.scrollLeft -= half;
    } else if (scroller.scrollLeft < 0) {
        scroller.scrollLeft += half;
    }
}

function FeatureCarouselCard({ item }) {
    const Icon = item.icon;

    return (
        <article
            className="feature-carousel-card group relative w-[85vw] sm:w-[300px] md:w-[340px] flex-shrink-0 rounded-lg border border-border/80 bg-surface-muted/50 p-6 pb-8 transition-all duration-300 ease-smooth hover:-translate-y-1 hover:border-brand/40 hover:shadow-lift"
        >
            <span
                className="feature-carousel-stamp"
                aria-hidden
            >
                {item.stamp}
            </span>

            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-foreground-muted transition-all duration-300 ease-smooth group-hover:rotate-6 group-hover:bg-brand group-hover:text-white">
                <Icon className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-brand text-lg font-semibold text-foreground">
                {item.title}
            </h3>
            <p className="mt-2 text-sm text-foreground-muted leading-relaxed">{item.text}</p>
        </article>
    );
}

export default function FeatureCarousel({ items, className = '', ariaLabel = 'Why you need Waraqah' }) {
    const scrollerRef = useRef(null);
    const pausedRef = useRef(false);
    const draggingRef = useRef(false);
    const reducedMotionRef = useRef(false);
    const resumeTimeoutRef = useRef(null);
    const rafRef = useRef(null);
    const dragStartRef = useRef({ x: 0, scrollLeft: 0 });

    const clearResumeTimeout = useCallback(() => {
        if (resumeTimeoutRef.current) {
            clearTimeout(resumeTimeoutRef.current);
            resumeTimeoutRef.current = null;
        }
    }, []);

    const scheduleResume = useCallback(() => {
        clearResumeTimeout();
        resumeTimeoutRef.current = setTimeout(() => {
            pausedRef.current = false;
            resumeTimeoutRef.current = null;
        }, RESUME_DELAY_MS);
    }, [clearResumeTimeout]);

    const pause = useCallback(() => {
        pausedRef.current = true;
        clearResumeTimeout();
    }, [clearResumeTimeout]);

    useEffect(() => {
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');

        const syncReducedMotion = () => {
            reducedMotionRef.current = media.matches;
        };

        syncReducedMotion();
        media.addEventListener('change', syncReducedMotion);

        return () => media.removeEventListener('change', syncReducedMotion);
    }, []);

    useEffect(() => {
        const tick = () => {
            const scroller = scrollerRef.current;
            if (
                scroller &&
                !pausedRef.current &&
                !draggingRef.current &&
                !reducedMotionRef.current
            ) {
                scroller.scrollLeft += AUTO_SCROLL_SPEED;
                normalizeScrollLeft(scroller);
            }
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);

        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
            clearResumeTimeout();
        };
    }, [clearResumeTimeout]);

    const handlePointerEnter = () => {
        pause();
    };

    const handlePointerLeave = () => {
        if (!draggingRef.current) {
            scheduleResume();
        }
    };

    const handlePointerDown = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        const scroller = scrollerRef.current;
        if (!scroller) return;

        pause();
        draggingRef.current = true;
        dragStartRef.current = {
            x: event.clientX,
            scrollLeft: scroller.scrollLeft,
        };
        scroller.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event) => {
        if (!draggingRef.current) return;

        const scroller = scrollerRef.current;
        if (!scroller) return;

        const delta = event.clientX - dragStartRef.current.x;
        scroller.scrollLeft = dragStartRef.current.scrollLeft - delta;
        normalizeScrollLeft(scroller);
    };

    const endDrag = (event) => {
        if (!draggingRef.current) return;

        const scroller = scrollerRef.current;
        draggingRef.current = false;

        if (scroller?.hasPointerCapture(event.pointerId)) {
            scroller.releasePointerCapture(event.pointerId);
        }

        scheduleResume();
    };

    const loopedItems = [...items, ...items];

    return (
        <div
            role="region"
            aria-label={ariaLabel}
            className={`-mx-4 sm:-mx-6 ${className}`.trim()}
        >
            <div className="feature-carousel-mask">
                <div
                    ref={scrollerRef}
                    tabIndex={0}
                    className="feature-carousel-scroller overflow-x-auto scroll-x-touch cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-brand/30 focus-visible:ring-offset-2"
                    onPointerEnter={handlePointerEnter}
                    onPointerLeave={handlePointerLeave}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                >
                    <div className="flex w-max gap-6 px-[7.5vw] sm:px-6 py-1">
                        {loopedItems.map((item, index) => (
                            <FeatureCarouselCard
                                key={`${item.title}-${index}`}
                                item={item}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
