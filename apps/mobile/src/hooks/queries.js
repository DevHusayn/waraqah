import { useQuery } from '@tanstack/react-query';
import { uniqueVendorNames } from '@waraqah/shared';
import { apiFetch } from '../api/client';

export function useDashboardQuery() {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: () => apiFetch('/invoices/dashboard'),
    });
}

export function useClientsQuery() {
    return useQuery({
        queryKey: ['clients'],
        queryFn: () => apiFetch('/clients'),
    });
}

export function useProductsQuery() {
    return useQuery({
        queryKey: ['products'],
        queryFn: () => apiFetch('/products'),
    });
}

export function useInvoicesQuery() {
    return useQuery({
        queryKey: ['invoices'],
        queryFn: () => apiFetch('/invoices'),
    });
}

export function useExpenseVendorsQuery({ enabled = true } = {}) {
    return useQuery({
        queryKey: ['expenseVendors'],
        queryFn: async () => {
            const payload = await apiFetch('/expenses/vendors');
            return uniqueVendorNames(Array.isArray(payload) ? payload : []);
        },
        enabled,
    });
}
