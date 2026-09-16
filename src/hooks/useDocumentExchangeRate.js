import { useCallback, useState } from 'react';
import {
    isValidExchangeRate,
    needsExchangeRate,
    normalizeCurrency,
} from '@waraqah/shared';

export function useDocumentExchangeRate({
    formData,
    setFormData,
    businessCurrency,
    markDirty,
}) {
    const [open, setOpen] = useState(false);
    const [pendingCurrency, setPendingCurrency] = useState(null);

    const handleCurrencyChange = useCallback(
        (currency) => {
            const next = normalizeCurrency(currency);
            const base = normalizeCurrency(businessCurrency);
            const current = normalizeCurrency(formData.currency);
            if (next === current) return;
            if (!needsExchangeRate(next, base)) {
                markDirty?.();
                setFormData((prev) => ({ ...prev, currency: next, exchangeRate: 1 }));
                return;
            }
            setPendingCurrency(next);
            setOpen(true);
        },
        [businessCurrency, formData.currency, markDirty, setFormData]
    );

    const confirmExchangeRate = useCallback(
        (rate) => {
            if (!isValidExchangeRate(rate)) return false;
            const next = pendingCurrency || formData.currency;
            markDirty?.();
            setFormData((prev) => ({
                ...prev,
                currency: normalizeCurrency(next),
                exchangeRate: Number(rate),
            }));
            setPendingCurrency(null);
            setOpen(false);
            return true;
        },
        [formData.currency, markDirty, pendingCurrency, setFormData]
    );

    const cancelExchangeRate = useCallback(() => {
        setPendingCurrency(null);
        setOpen(false);
        setFormData((prev) => {
            if (
                needsExchangeRate(prev.currency, businessCurrency) &&
                !isValidExchangeRate(prev.exchangeRate)
            ) {
                return {
                    ...prev,
                    currency: normalizeCurrency(businessCurrency),
                    exchangeRate: 1,
                };
            }
            return prev;
        });
    }, [businessCurrency, setFormData]);

    const ensureExchangeRate = useCallback(() => {
        if (
            needsExchangeRate(formData.currency, businessCurrency) &&
            !isValidExchangeRate(formData.exchangeRate)
        ) {
            setPendingCurrency(formData.currency);
            setOpen(true);
            return false;
        }
        return true;
    }, [businessCurrency, formData.currency, formData.exchangeRate]);

    return {
        exchangeRateOpen: open,
        pendingCurrency: pendingCurrency || formData.currency,
        handleCurrencyChange,
        confirmExchangeRate,
        cancelExchangeRate,
        ensureExchangeRate,
    };
}
