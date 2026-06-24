import { useMemo } from 'react';
import { canCreateInvoice } from '@waraqah/shared';
import { useInvoice } from '../context/InvoiceContext';

export function useInvoiceCreateGuard(limitModalRef, navigation) {
    const { invoiceUsage } = useInvoice();

    const tryCreate = (navigateFn) => {
        if (!canCreateInvoice(invoiceUsage)) {
            limitModalRef?.current?.open();
            return false;
        }
        if (typeof navigateFn === 'function') {
            navigateFn();
        } else if (navigation) {
            navigation.navigate('CreateInvoice');
        }
        return true;
    };

    const goUpgrade = () => {
        limitModalRef?.current?.close();
        const parent = navigation?.getParent?.();
        if (parent) {
            parent.navigate('More', { screen: 'Upgrade' });
        } else {
            navigation?.navigate('More', { screen: 'Upgrade' });
        }
    };

    return useMemo(
        () => ({
            invoiceUsage,
            tryCreate,
            goUpgrade,
        }),
        [invoiceUsage, navigation]
    );
}
