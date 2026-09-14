import DataTable, { DataTableRow, DataTableCell } from './DataTable';
import EmptyState from './EmptyState';
import { TableSkeleton } from './Skeleton';
import { formatCurrency } from '../utils/currency';

function formatQtySold(value) {
    const n = Number(value) || 0;
    return String(Math.round(n * 10) / 10);
}

export default function TopRankedTable({
    title,
    columns,
    items = [],
    loading = false,
    emptyTitle,
    emptyDescription,
    onRowClick,
    nameClassName = '',
    periodFilter = null,
}) {
    const showSkeleton = loading && items.length === 0;

    return (
        <section className="mb-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {periodFilter}
            </div>

            {showSkeleton ? (
                <TableSkeleton rows={5} columns={columns.length} />
            ) : items.length === 0 ? (
                <div className="card">
                    <EmptyState
                        title={emptyTitle}
                        description={emptyDescription}
                        className="py-8"
                    />
                </div>
            ) : (
                <DataTable columns={columns}>
                    {items.map((item, index) => {
                        const clickable = Boolean(onRowClick && item.id);
                        return (
                            <DataTableRow
                                key={item.id || `${item.name}-${index}`}
                                onClick={clickable ? () => onRowClick(item) : undefined}
                                className={clickable ? 'cursor-pointer' : ''}
                            >
                                {columns.map((column) => {
                                    if (column.key === 'rank') {
                                        return (
                                            <DataTableCell
                                                key={column.key}
                                                className={column.className || ''}
                                            >
                                                <span className="tabular-nums text-foreground-muted">
                                                    #{index + 1}
                                                </span>
                                            </DataTableCell>
                                        );
                                    }
                                    if (column.key === 'name') {
                                        return (
                                            <DataTableCell key={column.key}>
                                                <span
                                                    className={`font-medium text-foreground ${nameClassName}`.trim()}
                                                >
                                                    {item.name}
                                                </span>
                                            </DataTableCell>
                                        );
                                    }
                                    if (column.key === 'qtySold') {
                                        return (
                                            <DataTableCell
                                                key={column.key}
                                                className="text-right tabular-nums"
                                            >
                                                {formatQtySold(item.qtySold)}
                                            </DataTableCell>
                                        );
                                    }
                                    if (column.key === 'revenue') {
                                        return (
                                            <DataTableCell
                                                key={column.key}
                                                className="text-right tabular-nums"
                                            >
                                                {formatCurrency(item.revenue ?? 0)}
                                            </DataTableCell>
                                        );
                                    }
                                    if (column.key === 'documentCount') {
                                        return (
                                            <DataTableCell
                                                key={column.key}
                                                className="text-right tabular-nums"
                                            >
                                                {item.documentCount ?? 0}
                                            </DataTableCell>
                                        );
                                    }
                                    return (
                                        <DataTableCell key={column.key} className={column.className || ''}>
                                            {item[column.key] ?? '—'}
                                        </DataTableCell>
                                    );
                                })}
                            </DataTableRow>
                        );
                    })}
                </DataTable>
            )}
        </section>
    );
}
