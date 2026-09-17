import { useEffect, useState } from 'react';
import { ArrowRight, ArrowRightLeft } from 'lucide-react';
import ModalShell from './ModalShell';
import Spinner from './Spinner';
import {
    computeBaseAmounts,
    formatCurrency,
    formatExchangeRateValue,
    getCurrencyInfo,
    isValidExchangeRate,
    parseExchangeRateInput,
    sanitizeExchangeRateInput,
} from '../utils/currency';

function quoteAmount(amount, currency) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return '';
    if (n !== 0 && Math.abs(n) < 0.01) {
        return `${formatExchangeRateValue(n)} ${currency}`;
    }
    return formatCurrency(n, currency);
}

function CurrencyPair({ from, to }) {
    return (
        <div className="inline-flex items-center gap-2 rounded-lg border border-border/70 bg-surface-muted/60 px-2.5 py-1.5 text-xs font-semibold tracking-wide text-foreground">
            <span className="tabular-nums">{from}</span>
            <ArrowRight className="h-3.5 w-3.5 text-foreground-muted" aria-hidden />
            <span className="tabular-nums">{to}</span>
        </div>
    );
}

export default function BooksCurrencyRebaseModal({
    open,
    fromCurrency,
    toCurrency,
    saving = false,
    mode = 'convert',
    initialRate = '',
    onCancel,
    onConfirm,
}) {
    const [rate, setRate] = useState('');
    const correcting = mode === 'correct';
    const fromInfo = getCurrencyInfo(fromCurrency);
    const toInfo = getCurrencyInfo(toCurrency);

    useEffect(() => {
        if (!open) return;
        setRate(initialRate ? sanitizeExchangeRateInput(String(initialRate)) : '');
    }, [open, fromCurrency, toCurrency, initialRate, mode]);

    const parsed = parseExchangeRateInput(rate);
    const valid = isValidExchangeRate(parsed);
    const unchanged =
        correcting &&
        valid &&
        isValidExchangeRate(initialRate) &&
        parsed === Number(initialRate);
    const convertedOne = valid
        ? computeBaseAmounts({ total: 1, exchangeRate: parsed }).baseTotal
        : null;
    const convertedThousand = valid
        ? computeBaseAmounts({ total: 1000, exchangeRate: parsed }).baseTotal
        : null;
    const inverse = valid ? 1 / parsed : null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!valid || saving || unchanged) return;
        onConfirm(parsed);
    };

    return (
        <ModalShell
            open={open}
            onClose={saving ? undefined : onCancel}
            size="sm"
            ariaLabelledby="books-currency-rebase-title"
            ariaDescribedby="books-currency-rebase-desc"
        >
            <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-subtle text-brand mb-3">
                    <ArrowRightLeft size={18} aria-hidden />
                </div>

                <h2
                    id="books-currency-rebase-title"
                    className="text-base font-semibold text-foreground"
                >
                    {correcting ? 'Correct conversion rate' : 'Convert your books'}
                </h2>

                <div className="mt-3">
                    <CurrencyPair from={fromCurrency} to={toCurrency} />
                </div>

                <p
                    id="books-currency-rebase-desc"
                    className="mt-3 text-sm text-foreground-muted leading-relaxed"
                >
                    {correcting ? (
                        <>
                            Enter the rate that should have been used. Only amounts from that
                            conversion are restated; newer records stay as entered.
                        </>
                    ) : (
                        <>
                            Enter how many {toInfo.code} equal 1 {fromInfo.code}. Client invoices keep
                            their original currency. Dashboard totals, expenses, payroll, and product
                            prices convert at this rate.
                        </>
                    )}
                </p>

                <label htmlFor="books-rebase-rate-input" className="label mt-5">
                    1 {fromCurrency} equals
                </label>
                <div className="relative mt-1.5">
                    <input
                        id="books-rebase-rate-input"
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        value={rate}
                        onChange={(e) => setRate(sanitizeExchangeRateInput(e.target.value))}
                        placeholder="0.00"
                        className="input-field pr-14 tabular-nums text-base"
                        autoFocus
                        disabled={saving}
                        aria-describedby={valid ? 'books-rebase-preview' : undefined}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-foreground-muted">
                        {toCurrency}
                    </span>
                </div>

                {valid ? (
                    <div
                        id="books-rebase-preview"
                        className="mt-3 rounded-xl border border-border/60 bg-surface-muted/50 px-3.5 py-3"
                    >
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground-muted">
                            Preview
                        </p>
                        <dl className="mt-2 space-y-1.5 text-sm">
                            <div className="flex items-baseline justify-between gap-3">
                                <dt className="text-foreground-muted tabular-nums">
                                    {quoteAmount(1, fromCurrency)}
                                </dt>
                                <dd className="font-semibold text-foreground tabular-nums text-right">
                                    {quoteAmount(convertedOne, toCurrency)}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3">
                                <dt className="text-foreground-muted tabular-nums">
                                    {quoteAmount(1000, fromCurrency)}
                                </dt>
                                <dd className="font-semibold text-foreground tabular-nums text-right">
                                    {quoteAmount(convertedThousand, toCurrency)}
                                </dd>
                            </div>
                            {inverse != null ? (
                                <div className="flex items-baseline justify-between gap-3 border-t border-border/50 pt-1.5 mt-1.5">
                                    <dt className="text-foreground-muted">1 {toCurrency}</dt>
                                    <dd className="text-foreground-muted tabular-nums text-right">
                                        ≈ {formatExchangeRateValue(inverse)} {fromCurrency}
                                    </dd>
                                </div>
                            ) : null}
                        </dl>
                    </div>
                ) : (
                    <p className="mt-2 text-xs text-foreground-muted">
                        Example: if 1 {fromCurrency} is worth 0.00067 {toCurrency}, enter 0.00067.
                    </p>
                )}

                <p className="mt-3 text-xs text-foreground-muted leading-relaxed">
                    {correcting
                        ? 'Subscription billing stays in Nigerian Naira.'
                        : 'One rate applies to all existing amounts. Subscription billing stays in Nigerian Naira.'}
                </p>

                <div className="mt-6 flex flex-col-reverse sm:flex-row gap-2">
                    <button
                        type="button"
                        className="btn-secondary flex-1"
                        onClick={onCancel}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary flex-1"
                        disabled={!valid || saving || unchanged}
                    >
                        {saving ? (
                            <>
                                <Spinner size="sm" inline tone="on-color" />
                                {correcting ? 'Updating…' : 'Converting…'}
                            </>
                        ) : correcting ? (
                            'Update rate'
                        ) : (
                            `Convert to ${toCurrency}`
                        )}
                    </button>
                </div>
            </form>
        </ModalShell>
    );
}
