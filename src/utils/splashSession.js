import { isStandalonePwa } from './isStandalonePwa';

const PWA_SESSION_ALIVE_KEY = 'waraqah_pwa_session_alive';

function getNavigationType() {
    const entry = performance.getEntriesByType('navigation')[0];
    return entry?.type ?? 'navigate';
}

/** Register once: clear session marker when the PWA process is actually unloaded. */
export function initPwaSessionLifecycle() {
    if (typeof window === 'undefined' || window.__waraqahPwaLifecycleInit) {
        return;
    }

    window.__waraqahPwaLifecycleInit = true;

    window.addEventListener('pagehide', (event) => {
        if (event.persisted) {
            return;
        }

        try {
            sessionStorage.removeItem(PWA_SESSION_ALIVE_KEY);
        } catch {
            // ignore storage failures
        }
    });
}

/** Warm start = in-session reload/resume, not a cold launch after the app was closed. */
export function isWarmPwaStart() {
    const navType = getNavigationType();

    if (navType === 'reload' || navType === 'back_forward') {
        return true;
    }

    try {
        return sessionStorage.getItem(PWA_SESSION_ALIVE_KEY) === '1';
    } catch {
        return false;
    }
}

/** Show animated splash only for installed PWA cold starts. */
export function shouldShowPwaSplash() {
    if (!isStandalonePwa()) {
        return false;
    }

    return !isWarmPwaStart();
}

export function markPwaSessionAlive() {
    try {
        sessionStorage.setItem(PWA_SESSION_ALIVE_KEY, '1');
    } catch {
        // ignore storage failures
    }
}
