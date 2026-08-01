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

/**
 * Poll our DB for active subscription (webhook-updated). Does not call Paystack.
 */
export async function pollSubscriptionStatus({
    businessInfo,
    refreshBusinessInfo,
    onAttempt,
} = {}) {
    if (isPremiumUser(businessInfo)) {
        return successResult();
    }

    for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
        const delayBefore = attempt > 1 ? POLL_DELAYS_MS[attempt - 2] : 0;
        onAttempt?.(attempt, delayBefore);

        if (attempt > 1) {
            await delay(POLL_DELAYS_MS[attempt - 2]);
        }

        try {
            if (await checkDbSubscriptionActive(refreshBusinessInfo)) {
                return successResult();
            }
        } catch {
            /* transient errors — keep polling until ceiling */
        }
    }

    return processingResult();
}

/** Single DB status check for manual "Check again" — no background loop. */
export async function checkSubscriptionStatusManual({
    businessInfo,
    refreshBusinessInfo,
} = {}) {
    if (isPremiumUser(businessInfo)) {
        return successResult();
    }

    try {
        if (await checkDbSubscriptionActive(refreshBusinessInfo)) {
            return successResult();
        }
    } catch {
        /* treat as still processing */
    }

    return processingResult();
}
