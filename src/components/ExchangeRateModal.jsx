import { useEffect, useState } from 'react';
import ModalShell from './ModalShell';
import AmountInput from './AmountInput';
import { formatCurrency, isValidExchangeRate } from '../utils/currency';
import { computeBaseAmounts } from '@waraqah/shared';

export default function ExchangeRateModal({
    open,
    documentCurrency,
    businessCurrency,
    sampleAmount = 1,
    initialRate = '',
    onCancel,
    onConfirm,
}) {
    const [rate, setRate] = useState('');

    useEffect(() => {
        if (!open) return;
        setRate(isValidExchangeRate(initialRate) ? String(initialRate) : '');
    }, [open, initialRate]);

    const valid = isValidExchangeRate(rate);
    const preview = valid
        ? computeBaseAmounts({ total: sampleAmount || 1, exchangeRate: rate }).baseTotal
        : null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!valid) return;
        onConfirm(Number(rate));
    };

    return (
        <ModalShell
            open={open}
            onClose={onCancel}
            size="sm"
            ariaLabelledby="exchange-rate-modal-title"
        >
            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                <h2
                    id="exchange-rate-modal-title"
                    className="text-base font-semibold text-foreground"
                >
                    Exchange rate
                </h2>
                <p className="mt-2 text-sm text-foreground-muted">
                    This {documentCurrency} document stays in {documentCurrency} for the client.
                    Enter how many {businessCurrency} equal 1 {documentCurrency} so earnings stay in{' '}
                    {businessCurrency}.
                </p>
                <label htmlFor="exchange-rate-input" className="label mt-4">
                    1 {documentCurrency} in {businessCurrency}
                </label>
                <AmountInput
                    id="exchange-rate-input"
                    value={rate}
                    onChange={setRate}
                    numeric
                    placeholder="0.00"
                    className="mt-1"
                    autoFocus
                />
                {preview != null ? (
                    <p className="mt-3 text-sm text-foreground-muted">
                        {formatCurrency(sampleAmount || 1, documentCurrency)} × {rate} ={' '}
                        <span className="font-medium text-foreground">
                            {formatCurrency(preview, businessCurrency)}
                        </span>
                    </p>
                ) : null}
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                    <button type="button" className="btn-secondary w-full sm:w-auto" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn-primary w-full sm:w-auto" disabled={!valid}>
                        Save rate
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
