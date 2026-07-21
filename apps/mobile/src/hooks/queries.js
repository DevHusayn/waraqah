import { useQuery } from '@tanstack/react-query';
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
