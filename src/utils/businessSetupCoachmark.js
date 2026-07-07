const SESSION_FLAG = 'showBusinessSetupCoachmark';
const DISMISS_KEY_PREFIX = 'businessSetupCoachmarkDismissed:';

export function markBusinessSetupCoachmark() {
    try {
        sessionStorage.setItem(SESSION_FLAG, '1');
    } catch {
        /* ignore */
    }
}

export function clearBusinessSetupCoachmarkFlag() {
    try {
        sessionStorage.removeItem(SESSION_FLAG);
    } catch {
        /* ignore */
    }
}

export function hasBusinessSetupCoachmarkFlag() {
    try {
        return sessionStorage.getItem(SESSION_FLAG) === '1';
    } catch {
        return false;
    }
}

export function isBusinessSetupCoachmarkDismissed(userId) {
    if (!userId) return false;
    try {
        return localStorage.getItem(`${DISMISS_KEY_PREFIX}${userId}`) === '1';
    } catch {
        return false;
    }
}

export function dismissBusinessSetupCoachmark(userId) {
    if (!userId) return;
    try {
        localStorage.setItem(`${DISMISS_KEY_PREFIX}${userId}`, '1');
    } catch {
        /* ignore */
    }
    clearBusinessSetupCoachmarkFlag();
}
