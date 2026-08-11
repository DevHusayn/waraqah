import LowStockBadge from './LowStockBadge';
import { isInventoryTracked, isLowStock } from '../utils/stockWarnings';

function InStockBadge({ className = '' }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-md bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700 ${className}`.trim()}
        >
            In stock
        </span>
    );
}

function OutOfStockBadge({ className = '' }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700 ${className}`.trim()}
        >
            Out of stock
        </span>
    );
}

function UntrackedBadge({ className = '' }) {
    return (
        <span
            className={`inline-flex shrink-0 items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 ${className}`.trim()}
        >
            Untracked
        </span>
    );
}

export default function ProductStockStatusBadge({ product, className = '' }) {
    if (!isInventoryTracked(product)) {
        return <UntrackedBadge className={className} />;
    }

    const qty = Number(product.quantityOnHand ?? 0);
    if (qty <= 0) return <OutOfStockBadge className={className} />;
    if (isLowStock(product)) return <LowStockBadge className={className} />;
    return <InStockBadge className={className} />;
}
