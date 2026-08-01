import { apiFetch } from './api';
import { isPremiumUser } from './premium';

/** Delays before retries 2–5: 1s, 2s, 4s, 8s */
export const POLL_DELAYS_MS = [1000, 2000, 4000, 8000];
export const MAX_POLL_ATTEMPTS = POLL_DELAYS_MS.length + 1;

const PROCESSING_MESSAGE =
    'Your payment is still processing. This can take a minute — Premium will activate as soon as we receive confirmation.';

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function successResult(message = 'Payment successful. Premium is now active.') {
    return { status: 'success', message };
}

function processingResult(message = PROCESSING_MESSAGE) {
    return { status: 'processing', message };
}

async function checkDbSubscriptionActive(refreshBusinessInfo) {
    try {
        const plan = await apiFetch('/payments/plan');
        if (plan?.subscription?.status === 'active') {
            await refreshBusinessInfo?.();
            return true;
        }
    } catch {
        /* fall through to business-info check */
    }

    const info = await refreshBusinessInfo?.();
    return isPremiumUser(info);
}

async function tryVerifyWithPaystack(reference) {
    if (!reference) return false;
    try {
        await apiFetch(`/payments/verify/${encodeURIComponent(reference)}`);
        return true;
    } catch {
        return false;
    }
}

/**
 * Poll our DB for active subscription. Calls verify on attempt 1 as a fallback when
 * the Paystack webhook has not reached the server yet (common in local dev).
 */
export async function pollSubscriptionStatus({
    reference,
    businessInfo,
    refreshBusinessInfo,
    onAttempt,
    signal,
} = {}) {
    if (isPremiumUser(businessInfo)) {
        return successResult();
    }

    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
        if (signal?.aborted) {
            return processingResult();
        }

        const delayBefore = attempt > 1 ? POLL_DELAYS_MS[attempt - 2] : 0;
        onAttempt?.(attempt, delayBefore);

        if (attempt > 1) {
            await delay(POLL_DELAYS_MS[attempt - 2]);
            if (signal?.aborted) {
                return processingResult();
            }
        }

        try {
            if (reference && attempt === 1) {
                await tryVerifyWithPaystack(reference);
            }
            if (await checkDbSubscriptionActive(refreshBusinessInfo)) {
                return successResult();
            }
        } catch {
            /* transient errors — keep polling until ceiling */
        }
    }

    return processingResult();
}

/** Single DB status check for manual "Check again" — verifies with Paystack when reference known. */
export async function checkSubscriptionStatusManual({
    reference,
    businessInfo,
    refreshBusinessInfo,
} = {}) {
    if (isPremiumUser(businessInfo)) {
        return successResult();
    }

    try {
        if (reference) {
            await tryVerifyWithPaystack(reference);
        }
        if (await checkDbSubscriptionActive(refreshBusinessInfo)) {
            return successResult();
        }
    } catch {
        /* treat as still processing */
    }

    return processingResult();
}
