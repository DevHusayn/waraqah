import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { formatCurrency, getInvoiceBalanceDue } from '@waraqah/shared';
import Spinner from './Spinner';
import { MARK_PAID_METHODS } from '../utils/receiptHelpers';
import ModalShell from './ModalShell';
import RequiredLabel from './RequiredLabel';
import FieldValidationMessage from './FieldValidationMessage';
import CustomSelect from './CustomSelect';
import DatePickerField from './DatePickerField';
import AmountInput from './AmountInput';
import { parseAmountInput } from '../utils/numberInput';

const MONEY_EPS = 0.009;

function parseAmount(value) {
    const parsed = parseAmountInput(value);
    if (value === '' || value == null) return NaN;
    return Number.isFinite(parsed) ? parsed : NaN;
}

function amountsMatch(a, b) {
    return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < MONEY_EPS;
}

export default function MarkAsPaidModal({
    open,
    invoice,
    onConfirm,
    onCancel,
    saving = false,
    variant = 'invoice',
}) {
    const isReceipt = variant === 'receipt';
    const balanceDue = useMemo(() => getInvoiceBalanceDue(invoice), [invoice]);
    const currency = invoice?.currency || 'NGN';

    const [paymentMethod, setPaymentMethod] = useState('');
    const [datePaid, setDatePaid] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState('');
    const [paidFully, setPaidFully] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setPaymentMethod('');
            setDatePaid(format(new Date(), 'yyyy-MM-dd'));
            setPaidFully(true);
            setAmount(balanceDue > 0 ? balanceDue : '');
            setError('');
        }
    }, [open, balanceDue]);

    const amountNumber = paidFully ? balanceDue : parseAmount(amount);
    const isFullPayment = paidFully || amountsMatch(amountNumber, balanceDue);
    const balanceAfter =
        Number.isFinite(amountNumber) && amountNumber > 0
            ? Math.max(0, Math.round((balanceDue - amountNumber) * 100) / 100)
            : balanceDue;

    const handlePaidFullyChange = (checked) => {
        setPaidFully(checked);
        setError('');
        if (checked) {
            setAmount(balanceDue > 0 ? balanceDue : '');
        }
    };

    const handleAmountChange = (value) => {
        setAmount(value);
        setError('');
        const parsed = parseAmount(value);
        setPaidFully(amountsMatch(parsed, balanceDue));
    };

    const handleConfirm = () => {
        if (!paymentMethod) {
            setError(
                isReceipt
                    ? 'Please select how this payment was received.'
                    : 'Please select how this invoice was paid.'
            );
            return;
        }
        if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
            setError('Enter the amount paid (greater than zero).');
            return;
        }
        if (amountNumber > balanceDue + MONEY_EPS) {
            setError(
                `Amount paid cannot exceed the balance due (${formatCurrency(balanceDue, currency)}).`
            );
            return;
        }
        const isoDate = datePaid
            ? new Date(`${datePaid}T12:00:00`).toISOString()
            : new Date().toISOString();
        onConfirm({
            amount: Math.min(amountNumber, balanceDue),
            paymentMethod,
            datePaid: isoDate,
        });
    };

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onCancel}
            size="md"
            showClose
            ariaLabelledby="record-payment-title"
        >
            <div className="px-6 pt-6 pb-4 border-b border-border/50">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-green-100 shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600" aria-hidden />
                    </div>
                    <div>
                        <h2 id="record-payment-title" className="text-lg font-semibold text-foreground">
                            Record payment
                        </h2>
                        <p className="text-sm text-foreground-muted mt-0.5">
                            {isReceipt ? 'Balance remaining' : 'Balance due'}{' '}
                            {formatCurrency(balanceDue, currency)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-5">
                <div>
                    <RequiredLabel htmlFor="record-payment-amount">Amount paid</RequiredLabel>
                    <AmountInput
                        id="record-payment-amount"
                        value={paidFully ? balanceDue : amount}
                        onChange={handleAmountChange}
                        numeric
                        disabled={saving || paidFully}
                        className="disabled:bg-surface-muted disabled:text-foreground-muted"
                    />
                    <label
                        htmlFor="record-payment-paid-fully"
                        className="mt-2.5 flex items-center gap-2 cursor-pointer select-none w-fit"
                    >
                        <input
                            id="record-payment-paid-fully"
                            type="checkbox"
                            checked={paidFully}
                            disabled={saving || balanceDue <= 0}
                            onChange={(e) => handlePaidFullyChange(e.target.checked)}
                            className="h-4 w-4 rounded border-zinc-300 accent-brand focus:ring-brand/30"
                        />
                        <span className="text-sm text-foreground-muted">Paid fully</span>
                    </label>
                    <p className="text-xs text-foreground-muted mt-2">
                        Balance after this payment:{' '}
                        <span className="font-medium text-foreground-muted">
                            {formatCurrency(balanceAfter, currency)}
                        </span>
                    </p>
                </div>

                <div>
                    <RequiredLabel htmlFor="mark-paid-method">Payment method</RequiredLabel>
                    <CustomSelect
                        id="mark-paid-method"
                        value={paymentMethod}
                        onChange={(val) => {
                            setPaymentMethod(val);
                            setError('');
                        }}
                        options={MARK_PAID_METHODS}
                        placeholder="Select payment method"
                        error={Boolean(error)}
                    />
                    <FieldValidationMessage message={error} />
                </div>

                <div>
                    <RequiredLabel htmlFor="mark-paid-date">Date paid</RequiredLabel>
                    <DatePickerField
                        id="mark-paid-date"
                        value={datePaid}
                        onChange={setDatePaid}
                        max={format(new Date(), 'yyyy-MM-dd')}
                    />
                </div>

                <div
                    className={`flex gap-3 rounded-xl border px-4 py-3 ${
                        isFullPayment
                            ? 'border-amber-200 bg-amber-50'
                            : 'border-sky-200 bg-sky-50'
                    }`}
                    role="note"
                >
                    <AlertTriangle
                        className={`h-5 w-5 shrink-0 mt-0.5 ${
                            isFullPayment ? 'text-amber-600' : 'text-sky-600'
                        }`}
                        aria-hidden
                    />
                    <div className="min-w-0">
                        {isFullPayment ? (
                            <>
                                <p className="text-sm font-semibold text-amber-950">
                                    {isReceipt
                                        ? 'This completes payment for this receipt'
                                        : 'This settles the invoice in full'}
                                </p>
                                <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
                                    {isReceipt
                                        ? 'The receipt will show the full amount received and zero balance remaining. You can email or share the updated receipt afterward.'
                                        : 'A receipt will be generated. Once fully paid, this invoice cannot be edited or deleted.'}
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-semibold text-sky-950">
                                    {isReceipt
                                        ? 'This records a partial payment'
                                        : 'This will mark the invoice as partially paid'}
                                </p>
                                <p className="text-sm text-sky-900/90 mt-1 leading-relaxed">
                                    {isReceipt
                                        ? 'You can record more payments on this receipt until the balance is cleared.'
                                        : 'You can record more payments later until the balance is cleared. A receipt is issued only when the invoice is fully paid.'}
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 p-6 border-t border-border/50">
                <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={saving}>
                    Cancel
                </button>
                <button type="button" onClick={handleConfirm} className="btn-primary flex-1" disabled={saving}>
                    {saving ? (
                        <>
                            <Spinner size="sm" inline />
                            Saving…
                        </>
                    ) : isFullPayment ? (
                        'Record full payment'
                    ) : (
                        'Record payment'
                    )}
                </button>
            </div>
        </ModalShell>
    );
}
