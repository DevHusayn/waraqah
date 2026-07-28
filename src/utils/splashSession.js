const SPLASH_SEEN_KEY = 'waraqah_splash_seen';

export function hasSeenSplash() {
    try {
        return sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';
    } catch {
        return false;
    }
}

export function markSplashSeen() {
    try {
        sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
        document.documentElement.classList.add('splash-seen');
    } catch {
        // ignore storage failures
    }
}
