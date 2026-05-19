import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';
import { canCreateInvoice } from '../utils/invoiceLimits';

export function useInvoiceCreateGuard() {
    const navigate = useNavigate();
    const { invoiceUsage } = useInvoice();
    const [limitModalOpen, setLimitModalOpen] = useState(false);

    const tryNavigateToCreate = useCallback(() => {
        if (!canCreateInvoice(invoiceUsage)) {
            setLimitModalOpen(true);
            return false;
        }
        navigate('/invoices/create');
        return true;
    }, [invoiceUsage, navigate]);

    return {
        invoiceUsage,
        limitModalOpen,
        setLimitModalOpen,
        tryNavigateToCreate,
        atLimit: invoiceUsage && !invoiceUsage.unlimited && !invoiceUsage.canCreate,
    };
}
