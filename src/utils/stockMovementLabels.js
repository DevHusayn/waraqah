function documentTypeLabel(source) {
    if (source === 'receipt') return 'Receipt';
    return 'Invoice';
}

function documentHref(source, id) {
    if (!id) return null;
    if (source === 'receipt') return `/receipts/${id}`;
    return `/invoices/${id}`;
}

const ACTION_LABELS = {
    adjustment: 'Manual adjustment',
    opening: 'Opening stock',
    set: 'Stock count updated',
    issue: 'issued',
    update: 'updated',
    cancel: 'cancelled',
    delete: 'deleted',
    receive: 'received',
};

export function formatStockMovementDescription(row) {
    if (!row) return '—';

    if (row.source === 'manual') {
        return ACTION_LABELS.adjustment;
    }

    if (row.source === 'opening') {
        return ACTION_LABELS.opening;
    }

    if (row.source === 'set') {
        return ACTION_LABELS.set;
    }

    if (row.source === 'invoice' || row.source === 'receipt') {
        const docLabel = documentTypeLabel(row.source);
        const actionLabel = ACTION_LABELS[row.action] || row.action;
        if (row.documentNumber) {
            return `${docLabel} ${row.documentNumber} ${actionLabel}`;
        }
        return `${docLabel} ${actionLabel}`;
    }

    if (row.source === 'purchase_order') {
        const actionLabel = ACTION_LABELS[row.action] || row.action;
        if (row.documentNumber) {
            return `PO ${row.documentNumber} ${actionLabel}`;
        }
        return `Purchase order ${actionLabel}`;
    }

    return 'Stock change';
}

export function getStockMovementLink(row) {
    if (!row?.documentId) return null;
    if (row.source === 'invoice' || row.source === 'receipt') {
        return documentHref(row.source, row.documentId);
    }
    if (row.source === 'purchase_order') {
        return `/purchase-orders/${row.documentId}`;
    }
    return null;
}

export function formatStockDelta(delta) {
    const value = Number(delta) || 0;
    if (value > 0) return `+${value}`;
    return String(value);
}
