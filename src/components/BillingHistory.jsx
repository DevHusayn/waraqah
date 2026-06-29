import { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { apiFetch } from '../utils/api';
import { formatCurrency } from '../utils/currency';
import EmptyState from './EmptyState';
import { TableSkeleton } from './Skeleton';
import DataTable, { DataTableRow, DataTableCell } from './DataTable';

const COLUMNS = [
    { key: 'date', label: 'Date' },
    { key: 'description', label: 'Description' },
    { key: 'amount', label: 'Amount', className: 'text-right' },
    { key: 'status', label: 'Status' },
];

const STATUS_STYLES = {
    success: 'bg-emerald-50/80 text-emerald-800 border-emerald-200/60',
    pending: 'bg-amber-50/80 text-amber-800 border-amber-200/60',
    failed: 'bg-red-50/80 text-red-800 border-red-200/60',
};

function PaymentStatusBadge({ status }) {
    const key = (status || 'pending').toLowerCase();
    const style = STATUS_STYLES[key] || STATUS_STYLES.pending;
    const label = key === 'success' ? 'Paid' : key;

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${style}`}
        >
            {label}
        </span>
    );
}

function paymentDescription(payment) {
    if (payment.type === 'subscription') {
        return 'Waraqah Premium subscription';
    }
    return 'Premium payment';
}

function paymentDate(payment) {
    const value = payment.paidAt || payment.createdAt;
    if (!value) return '—';
    return format(new Date(value), 'MMM d, yyyy');
}

export default function BillingHistory() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await apiFetch('/payments/history');
                if (!cancelled) {
                    setPayments(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message || 'Could not load billing history');
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <TableSkeleton rows={3} columns={4} />;
    }

    if (error) {
        return (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                {error}
            </p>
        );
    }

    if (payments.length === 0) {
        return (
            <div className="data-table-wrap">
                <EmptyState
                    icon={Receipt}
                    title="No payments yet"
                    description="Your subscription charges will appear here after you upgrade."
                />
            </div>
        );
    }

    return (
        <DataTable columns={COLUMNS}>
            {payments.map((payment) => (
                <DataTableRow key={payment.id}>
                    <DataTableCell>
                        <span className="text-zinc-700 tabular-nums">{paymentDate(payment)}</span>
                    </DataTableCell>
                    <DataTableCell>
                        <div className="min-w-0">
                            <p className="text-zinc-950 font-medium">{paymentDescription(payment)}</p>
                            {payment.reference ? (
                                <p className="text-xs text-zinc-500 truncate max-w-[200px]">
                                    Ref: {payment.reference}
                                </p>
                            ) : null}
                        </div>
                    </DataTableCell>
                    <DataTableCell className="text-right">
                        <span className="font-medium text-zinc-950 tabular-nums">
                            {formatCurrency(payment.amount)}
                        </span>
                    </DataTableCell>
                    <DataTableCell>
                        <PaymentStatusBadge status={payment.status} />
                    </DataTableCell>
                </DataTableRow>
            ))}
        </DataTable>
    );
}
