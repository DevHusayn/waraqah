import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import DataTable, { DataTableRow, DataTableCell } from './DataTable';
import PaginationBar from './PaginationBar';
import EmptyState from './EmptyState';
import { History } from 'lucide-react';
import {
    formatStockDelta,
    formatStockMovementDescription,
    getStockMovementLink,
} from '../utils/stockMovementLabels';

const BASE_COLUMNS = [
    { key: 'date', label: 'Date', width: '14%' },
    { key: 'change', label: 'Change', className: 'text-right', width: '12%' },
    { key: 'balance', label: 'Balance', className: 'text-right', width: '12%' },
    { key: 'source', label: 'Source', width: '62%' },
];

const PRODUCT_COLUMN = { key: 'product', label: 'Product', width: '22%' };

function formatDisplayDate(value) {
    if (!value) return '—';
    try {
        return format(parseISO(value), 'MMM d, yyyy');
    } catch {
        return value;
    }
}

function deltaClassName(delta) {
    if (delta > 0) return 'text-green-700 font-medium';
    if (delta < 0) return 'text-red-600 font-medium';
    return 'text-foreground-muted';
}

export default function StockMovementTable({
    rows = [],
    showProductColumn = false,
    pagination,
    onPageChange,
    emptyTitle = 'No stock movements yet',
    emptyDescription = 'Manual adjustments and sales from issued invoices or receipts will appear here.',
}) {
    const columns = showProductColumn
        ? [
              BASE_COLUMNS[0],
              PRODUCT_COLUMN,
              ...BASE_COLUMNS.slice(1).map((column) =>
                  column.key === 'source' ? { ...column, width: '40%' } : column
              ),
          ]
        : BASE_COLUMNS;

    if (!rows.length) {
        return (
            <div className="card">
                <EmptyState icon={History} title={emptyTitle} description={emptyDescription} />
            </div>
        );
    }

    return (
        <>
            <DataTable columns={columns} fixedLayout minWidth={640} className="scroll-x-touch">
                {rows.map((row) => {
                    const href = getStockMovementLink(row);
                    const description = formatStockMovementDescription(row);
                    const delta = Number(row.delta) || 0;

                    return (
                        <DataTableRow key={row.id}>
                            <DataTableCell>
                                {formatDisplayDate(row.date?.slice(0, 10))}
                            </DataTableCell>
                            {showProductColumn ? (
                                <DataTableCell>
                                    {row.productId ? (
                                        <Link
                                            to={`/products/${row.productId}`}
                                            className="font-medium text-brand hover:underline"
                                        >
                                            {row.productName || 'Product'}
                                        </Link>
                                    ) : (
                                        <span className="text-foreground-muted">{row.productName || '—'}</span>
                                    )}
                                </DataTableCell>
                            ) : null}
                            <DataTableCell className="text-right tabular-nums">
                                <span className={deltaClassName(delta)}>{formatStockDelta(delta)}</span>
                            </DataTableCell>
                            <DataTableCell className="text-right tabular-nums text-foreground">
                                {row.balanceAfter ?? '—'}
                            </DataTableCell>
                            <DataTableCell>
                                {href ? (
                                    <Link
                                        to={href}
                                        className="font-medium text-brand hover:underline"
                                    >
                                        {description}
                                    </Link>
                                ) : (
                                    <span className="text-foreground-muted">{description}</span>
                                )}
                            </DataTableCell>
                        </DataTableRow>
                    );
                })}
            </DataTable>
            {pagination && onPageChange ? (
                <PaginationBar pagination={pagination} onPageChange={onPageChange} />
            ) : null}
        </>
    );
}
