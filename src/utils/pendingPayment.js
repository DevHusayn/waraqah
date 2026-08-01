const PENDING_PAYMENT_REF_KEY = 'waraqah_pending_payment_ref';

export function setPendingPaymentReference(reference) {
    if (!reference) return;
    try {
        sessionStorage.setItem(PENDING_PAYMENT_REF_KEY, reference);
    } catch {
        // ignore storage failures
    }
}

export function getPendingPaymentReference() {
    try {
        return sessionStorage.getItem(PENDING_PAYMENT_REF_KEY);
    } catch {
        return null;
    }
}

export function clearPendingPaymentReference() {
    try {
        sessionStorage.removeItem(PENDING_PAYMENT_REF_KEY);
    } catch {
        // ignore storage failures
    }
}
