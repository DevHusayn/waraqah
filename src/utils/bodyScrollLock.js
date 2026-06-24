let lockCount = 0;
let savedScrollY = 0;

/**
 * Lock document body scroll (stackable — safe when sidebar + modal overlap).
 * Returns an unlock function for use in useEffect cleanup.
 */
export function lockBodyScroll() {
    if (lockCount === 0) {
        savedScrollY = window.scrollY;
        const { style } = document.body;
        style.position = 'fixed';
        style.top = `-${savedScrollY}px`;
        style.left = '0';
        style.right = '0';
        style.width = '100%';
        style.overflow = 'hidden';
    }
    lockCount += 1;

    return () => {
        if (lockCount <= 0) return;
        lockCount -= 1;
        if (lockCount === 0) {
            const { style } = document.body;
            style.position = '';
            style.top = '';
            style.left = '';
            style.right = '';
            style.width = '';
            style.overflow = '';
            window.scrollTo(0, savedScrollY);
        }
    };
}
