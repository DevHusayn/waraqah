import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import Spinner from './Spinner';
import { MARK_PAID_METHODS } from '../utils/receiptHelpers';
import ModalShell from './ModalShell';
import RequiredLabel from './RequiredLabel';
import FieldValidationMessage from './FieldValidationMessage';
import CustomSelect from './CustomSelect';
import DatePickerField from './DatePickerField';

export default function MarkAsPaidModal({ open, onConfirm, onCancel, saving = false }) {
    const [paymentMethod, setPaymentMethod] = useState('');
    const [datePaid, setDatePaid] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setPaymentMethod('');
            setDatePaid(format(new Date(), 'yyyy-MM-dd'));
            setError('');
        }
    }, [open]);

    const handleConfirm = () => {
        if (!paymentMethod) {
            setError('Please select how this invoice was paid.');
            return;
        }
        const isoDate = datePaid
            ? new Date(`${datePaid}T12:00:00`).toISOString()
            : new Date().toISOString();
        onConfirm({ paymentMethod, datePaid: isoDate });
    };

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onCancel}
            size="md"
            showClose
            ariaLabelledby="mark-paid-title"
        >
            <div className="px-6 pt-6 pb-4 border-b border-zinc-100">
                <div className="flex items-start gap-3 pr-8">
                    <div className="p-2.5 rounded-xl bg-emerald-100 shrink-0">
                        <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden />
                    </div>
                    <div>
                        <h2 id="mark-paid-title" className="text-lg font-semibold text-zinc-900">
                            Mark as paid
                        </h2>
                        <p className="text-sm text-zinc-500 mt-0.5">
                            Record payment details and generate a receipt
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-5">
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
                    className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
                    role="note"
                >
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-950">This action cannot be undone</p>
                        <p className="text-sm text-amber-900/90 mt-1 leading-relaxed">
                            Once marked as paid, this invoice cannot be edited or deleted. This keeps your
                            payment records accurate and auditable.
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 p-6 border-t border-zinc-100">
                <button type="button" onClick={onCancel} className="btn-secondary flex-1" disabled={saving}>
                    Cancel
                </button>
                <button type="button" onClick={handleConfirm} className="btn-primary flex-1" disabled={saving}>
                    {saving ? (
                        <>
                            <Spinner size="sm" inline />
                            Saving…
                        </>
                    ) : (
                        'Yes, mark as paid'
                    )}
                </button>
            </div>
        </ModalShell>
    );
}
