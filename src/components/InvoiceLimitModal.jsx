import { Link } from 'react-router-dom';
import { Crown, X } from 'lucide-react';
import { FREE_MONTHLY_INVOICE_LIMIT } from '../utils/invoiceLimits';

export default function InvoiceLimitModal({ open, onClose, usage }) {
    if (!open) return null;

    const limit = usage?.limit ?? FREE_MONTHLY_INVOICE_LIMIT;
    const used = usage?.used ?? limit;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 border border-zinc-100 relative" role="dialog" aria-modal="true">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-600 rounded-lg"
                    aria-label="Close"
                >
                    <X size={20} />
                </button>
                <div className="flex justify-center mb-4">
                    <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
                        <Crown className="h-7 w-7 text-amber-600" />
                    </div>
                </div>
                <h2 className="text-xl font-semibold text-zinc-900 text-center mb-2">
                    Monthly document limit reached
                </h2>
                <p className="text-zinc-600 text-center text-sm mb-6">
                    You have used all <strong>{limit}</strong> free invoices and quotations for this month
                    ({used}/{limit}). Upgrade to Premium for unlimited documents, custom logos, and more.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <Link to="/upgrade" className="premium-upgrade-btn mx-auto text-sm py-2 px-4" onClick={onClose}>
                        <Crown size={16} className="text-amber-600 shrink-0" aria-hidden />
                        Upgrade to Premium
                    </Link>
                    <button type="button" onClick={onClose} className="btn-secondary flex-1">
                        Not now
                    </button>
                </div>
            </div>
        </div>
    );
}
