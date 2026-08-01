import { useCallback, useEffect, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import {
    clearPendingPaymentReference,
    getPendingPaymentReference,
} from '../utils/pendingPayment';
import { pollSubscriptionStatus } from '../utils/paymentVerification';

/**
 * Recover from Paystack checkout when the user returns via the back button.
 * Polls DB subscription status with exponential backoff — no Paystack calls from the client.
 */
export function usePaystackReturnSync(onReset) {
    const { refreshBusinessInfo, businessInfo } = useSettings();
    const { showToast } = useToast();
    const syncingRef = useRef(false);

    const syncAfterReturn = useCallback(async () => {
        if (syncingRef.current) return;
        syncingRef.current = true;

        onReset?.();

        const reference = getPendingPaymentReference();
        if (reference) {
            const result = await pollSubscriptionStatus({
                businessInfo,
                refreshBusinessInfo,
            });

            if (result.status === 'success') {
                clearPendingPaymentReference();
                showToast('Premium activated!', 'success');
            } else {
                showToast(
                    'Payment is still processing. Check Plan & Billing in a moment.',
                    'info'
                );
            }
        } else {
            try {
                await refreshBusinessInfo();
            } catch {
                /* ignore refresh errors on back navigation */
            }
        }

        syncingRef.current = false;
    }, [onReset, refreshBusinessInfo, showToast, businessInfo]);

    useEffect(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        if (getPendingPaymentReference() || nav?.type === 'back_forward') {
            syncAfterReturn();
        }
    }, [syncAfterReturn]);

    useEffect(() => {
        const handlePageShow = (event) => {
            if (event.persisted) {
                syncAfterReturn();
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [syncAfterReturn]);
}
