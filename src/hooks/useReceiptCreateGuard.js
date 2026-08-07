import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { canCreateInvoice } from '../utils/invoiceLimits';

export function useReceiptCreateGuard() {
    const navigate = useNavigate();
    const { invoiceUsage } = useInvoice();
    const [limitModalOpen, setLimitModalOpen] = useState(false);

    const tryNavigateToCreate = useCallback(() => {
        if (invoiceUsage && !invoiceUsage.unlimited && !invoiceUsage.canCreate) {
            setLimitModalOpen(true);
            return false;
        }
        navigate('/receipts/create');
        return true;
    }, [navigate, invoiceUsage]);

    return {
        invoiceUsage,
        limitModalOpen,
        setLimitModalOpen,
        tryNavigateToCreate,
        atLimit: invoiceUsage && !canCreateInvoice(invoiceUsage),
    };
}
