import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoice } from '../context/InvoiceContext';

export function useInvoiceCreateGuard() {
    const navigate = useNavigate();
    const { invoiceUsage } = useInvoice();
    const [limitModalOpen, setLimitModalOpen] = useState(false);

    const tryNavigateToCreate = useCallback(() => {
        navigate('/invoices/create');
        return true;
    }, [navigate]);

    return {
        invoiceUsage,
        limitModalOpen,
        setLimitModalOpen,
        tryNavigateToCreate,
        atLimit: invoiceUsage && !invoiceUsage.unlimited && !invoiceUsage.canCreate,
    };
}
