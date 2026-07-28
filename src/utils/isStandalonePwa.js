const STANDALONE_DISPLAY_MODES = ['standalone', 'fullscreen', 'minimal-ui'];

/** True when the app is running as an installed PWA, not a regular browser tab. */
export function isStandalonePwa() {
    if (typeof window === 'undefined') {
        return false;
    }

    if (window.navigator.standalone === true) {
        return true;
    }

    return STANDALONE_DISPLAY_MODES.some((mode) =>
        window.matchMedia(`(display-mode: ${mode})`).matches
    );
}
