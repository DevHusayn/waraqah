import { FileText, ClipboardList, Users, Package } from 'lucide-react';
import ModalShell from './ModalShell';
import { useInvoiceCreateGuard } from '../hooks/useInvoiceCreateGuard';
import { useQuotationCreateGuard } from '../hooks/useQuotationCreateGuard';
import InvoiceLimitModal from './InvoiceLimitModal';

const OPTIONS = [
    {
        id: 'invoice',
        label: 'Invoice',
        description: 'Bill a client for work done',
        icon: FileText,
        tone: 'bg-brand-subtle text-brand',
    },
    {
        id: 'quotation',
        label: 'Quotation',
        description: 'Send a price estimate',
        icon: ClipboardList,
        tone: 'bg-sky-50 text-sky-700',
    },
    {
        id: 'client',
        label: 'Client',
        description: 'Add a new client contact',
        icon: Users,
        tone: 'bg-violet-50 text-violet-700',
        href: '/clients',
    },
    {
        id: 'product',
        label: 'Product',
        description: 'Save a product or service',
        icon: Package,
        tone: 'bg-amber-50 text-amber-700',
        href: '/products',
    },
];

export default function CreateDocumentModal({ open, onClose, navigate }) {
    const {
        invoiceUsage,
        limitModalOpen: invoiceLimitOpen,
        setLimitModalOpen: setInvoiceLimitOpen,
        tryNavigateToCreate: tryCreateInvoice,
    } = useInvoiceCreateGuard();
    const {
        limitModalOpen: quotationLimitOpen,
        setLimitModalOpen: setQuotationLimitOpen,
        tryNavigateToCreate: tryCreateQuotation,
    } = useQuotationCreateGuard();

    const handleSelect = (option) => {
        onClose?.();
        if (option.id === 'invoice') {
            tryCreateInvoice();
            return;
        }
        if (option.id === 'quotation') {
            tryCreateQuotation();
            return;
        }
        if (option.href) {
            navigate(option.href);
        }
    };

    return (
        <>
            <InvoiceLimitModal
                open={invoiceLimitOpen || quotationLimitOpen}
                onClose={() => {
                    setInvoiceLimitOpen(false);
                    setQuotationLimitOpen(false);
                }}
                usage={invoiceUsage}
            />
            <ModalShell
                open={open}
                onClose={onClose}
                size="md"
                showClose
                ariaLabelledby="create-document-title"
            >
                <div className="p-5 sm:p-6">
                    <h2 id="create-document-title" className="text-base font-semibold text-zinc-900">
                        Create new
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500">
                        Choose what you want to create
                    </p>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {OPTIONS.map((option) => {
                            const Icon = option.icon;
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className="flex items-start gap-3 rounded-lg border border-zinc-200/80 bg-white px-3.5 py-3 text-left hover:border-zinc-300 hover:bg-zinc-50/80 transition-colors"
                                >
                                    <span
                                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${option.tone}`}
                                    >
                                        <Icon size={18} aria-hidden />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-sm font-semibold text-zinc-900">
                                            {option.label}
                                        </span>
                                        <span className="block text-xs text-zinc-500 mt-0.5">
                                            {option.description}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </ModalShell>
        </>
    );
}
