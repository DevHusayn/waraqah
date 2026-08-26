import { useEffect } from 'react';
import { getDefaultDocumentFooter } from '@waraqah/shared';
import { isPremiumUser } from '../utils/premium';

/** Prefill footer on new premium documents once business info is available. */
export function useDocumentFooterPrefill({ id, businessInfo, mode, setFormData }) {
    useEffect(() => {
        if (id || !isPremiumUser(businessInfo)) return;
        setFormData((prev) => {
            if (String(prev.documentFooter || '').trim()) return prev;
            return {
                ...prev,
                documentFooter: getDefaultDocumentFooter(businessInfo?.name, mode),
            };
        });
    }, [id, businessInfo, mode, setFormData]);
}

export function resolveFormDocumentFooter(savedFooter, businessInfo, mode) {
    const trimmed = String(savedFooter || '').trim();
    if (trimmed) return trimmed;
    return getDefaultDocumentFooter(businessInfo?.name, mode);
}
