import { useEffect } from 'react';
import { APP_CURRENCY, normalizeCurrency } from '@waraqah/shared';
import { useSettings } from '../context/SettingsContext';

export default function useBusinessCurrency() {
    const { businessInfo } = useSettings();
    return normalizeCurrency(businessInfo?.defaultCurrency || APP_CURRENCY);
}

export function useDefaultDocumentCurrency(documentId, setFormData, isDirtyRef) {
    const businessCurrency = useBusinessCurrency();

    useEffect(() => {
        if (documentId) return;
        if (isDirtyRef?.current) return;
        setFormData((prev) =>
            prev.currency === businessCurrency ? prev : { ...prev, currency: businessCurrency }
        );
    }, [businessCurrency, documentId, setFormData, isDirtyRef]);

    return businessCurrency;
}
