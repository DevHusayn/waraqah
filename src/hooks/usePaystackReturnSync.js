import { useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import {
    clearPendingPaymentReference,
    getPendingPaymentReference,
} from '../utils/pendingPayment';

/**
 * Recover from Paystack checkout when the user returns via the back button.
 * Resets loading UI, verifies any pending payment, and refreshes plan status.
 */
export function usePaystackReturnSync(onReset) {
    const { refreshBusinessInfo, setBusinessInfo } = useSettings();
    const { showToast } = useToast();
    const syncingRef = useRef(false);

    const syncAfterReturn = useCallback(async () => {
        if (syncingRef.current) return;
        syncingRef.current = true;

        onReset?.();

        const reference = getPendingPaymentReference();
        if (reference) {
            try {
                const data = await apiFetch(`/payments/verify/${encodeURIComponent(reference)}`);
                clearPendingPaymentReference();
                if (data.businessInfo) {
                    setBusinessInfo(data.businessInfo);
                }
                showToast('Premium activated!', 'success');
            } catch (err) {
                const incomplete = err.status === 400;
                if (incomplete || err.status === 404) {
                    clearPendingPaymentReference();
                }
                showToast(
                    incomplete
                        ? 'Payment was not completed. You can try again when ready.'
                        : (err.message || 'Could not verify payment. Please try again.'),
                    incomplete ? 'info' : 'error',
                );
            }
        }

        try {
            await refreshBusinessInfo();
        } finally {
            syncingRef.current = false;
        }
    }, [onReset, refreshBusinessInfo, setBusinessInfo, showToast]);

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
