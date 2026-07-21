import { format } from 'date-fns';
import { FREE_PDF_FOOTER_CTA_PREFIX } from '@waraqah/shared';
import { APP_DOMAIN, APP_NAME, APP_TAGLINE, APP_WEBSITE_URL } from '../constants/brand';
import { formatCurrency } from '../utils/currency';
import { getClientBusiness } from '../utils/clientHelpers';
import {
    getCompanyLogoUrl,
    getCompanyStampUrl,
    getAuthorizedSignatureUrl,
} from '../utils/brandAssets';
import { isPremiumUser } from '../utils/premium';
import { getDocumentNumber, getPaymentMethodLabel } from '../utils/receiptHelpers';

function lightenHex(hex, amount = 0.88) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!match) return '#f0fdf4';
    const rgb = [match[1], match[2], match[3]].map((part) => parseInt(part, 16));
    const light = rgb.map((channel) => Math.min(255, Math.round(channel + (255 - channel) * amount)));
    return `rgb(${light.join(', ')})`;
}

const STATUS_STYLES = {
    paid: 'bg-green-500',
    pending: 'bg-yellow-500',
    overdue: 'bg-red-500',
    cancelled: 'bg-zinc-400',
};

function StatusBadge({ status }) {
    const label = (status || 'pending').toUpperCase();
    const tone = STATUS_STYLES[status] || STATUS_STYLES.pending;
    return (
        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide text-white ${tone}`}>
            {label}
        </span>
    );
}

function DetailBox({ label, children, brandColor, lightBrand, className = '' }) {
    return (
        <div
            className={`rounded-lg p-3 sm:p-4 ${className}`}
            style={{ backgroundColor: lightBrand }}
        >
            <p
                className="text-[10px] font-bold tracking-[0.12em] mb-2"
                style={{ color: brandColor }}
            >
                {label}
            </p>
            {children}
        </div>
    );
}

export default function InvoiceDocumentPreview({ invoice, client, businessInfo, mode = 'invoice' }) {
    const isReceipt = mode === 'receipt';
    const premium = isPremiumUser(businessInfo);
    const brandColor = businessInfo?.brandColor || '#16A34A';
    const lightBrand = lightenHex(brandColor);
    const docNumber = getDocumentNumber(invoice, mode) || (isReceipt ? 'RCP' : 'INV');
    const logoUrl = premium ? getCompanyLogoUrl(businessInfo) : '';
    const stampUrl = premium && isReceipt ? getCompanyStampUrl(businessInfo) : '';
    const signatureUrl = premium ? getAuthorizedSignatureUrl(businessInfo) : '';
    const badgeStatus = isReceipt ? 'paid' : invoice?.status;
    const issueDate = invoice?.date ? format(new Date(invoice.date), 'MMM dd, yyyy') : 'N/A';
    const hasDueDate = Boolean(invoice?.dueDate);
    const hasPaymentDetails = Boolean(
        businessInfo?.paymentAccountName?.trim()
        || businessInfo?.paymentBankName?.trim()
        || businessInfo?.paymentAccountNumber?.trim()
        || businessInfo?.paymentInstructions?.trim()
    );
    const showPaymentBox = !isReceipt && hasPaymentDetails;
    const notesText = invoice?.notes?.trim() || '';

    const paymentLines = [];
    if (showPaymentBox) {
        if (businessInfo.paymentBankName?.trim()) {
            paymentLines.push(`Bank Name: ${businessInfo.paymentBankName.trim()}`);
        }
        if (businessInfo.paymentAccountName?.trim()) {
            paymentLines.push(`Account Name: ${businessInfo.paymentAccountName.trim()}`);
        }
        if (businessInfo.paymentAccountNumber?.trim()) {
            paymentLines.push(`Account Number: ${businessInfo.paymentAccountNumber.trim()}`);
        }
        if (businessInfo.paymentInstructions?.trim()) {
            paymentLines.push(businessInfo.paymentInstructions.trim());
        }
    }

    return (
        <div className="bg-white text-zinc-800">
            <div className="px-4 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={businessInfo?.name || 'Business logo'}
                                className="h-10 sm:h-12 max-w-[160px] object-contain mb-3"
                            />
                        ) : null}
                        <p className="text-base sm:text-lg font-bold" style={{ color: brandColor }}>
                            {businessInfo?.name || 'Your Business'}
                        </p>
                        {businessInfo?.address ? (
                            <p className="mt-2 text-xs sm:text-sm text-zinc-500 whitespace-pre-wrap">
                                {businessInfo.address}
                            </p>
                        ) : null}
                        {businessInfo?.email ? (
                            <p className="text-xs sm:text-sm text-zinc-500">{businessInfo.email}</p>
                        ) : null}
                        {businessInfo?.phone ? (
                            <p className="text-xs sm:text-sm text-zinc-500">{businessInfo.phone}</p>
                        ) : null}
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                        <p className="text-2xl sm:text-[26px] font-bold text-zinc-800 tracking-tight">
                            {isReceipt ? 'RECEIPT' : 'INVOICE'}
                        </p>
                        <div
                            className="inline-flex mt-2 rounded-lg px-3 py-1.5 text-sm font-bold"
                            style={{ backgroundColor: lightBrand, color: brandColor }}
                        >
                            #{docNumber}
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DetailBox label="BILL TO" brandColor={brandColor} lightBrand={lightBrand}>
                        <p className="text-sm font-bold text-zinc-800">{client?.name || 'Client'}</p>
                        {getClientBusiness(client) ? (
                            <p className="mt-1 text-xs sm:text-sm text-zinc-500">{getClientBusiness(client)}</p>
                        ) : null}
                        {client?.email ? (
                            <p className="mt-1 text-xs sm:text-sm text-zinc-500">{client.email}</p>
                        ) : null}
                        {client?.phone ? (
                            <p className="text-xs sm:text-sm text-zinc-500">{client.phone}</p>
                        ) : null}
                        {client?.address ? (
                            <p className="mt-1 text-xs sm:text-sm text-zinc-500 whitespace-pre-wrap">
                                {client.address}
                            </p>
                        ) : null}
                    </DetailBox>

                    <DetailBox
                        label="DETAILS"
                        brandColor={brandColor}
                        lightBrand={lightBrand}
                        className="relative"
                    >
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
                            <StatusBadge status={badgeStatus} />
                        </div>
                        <div className="space-y-3 pr-16">
                            <div>
                                <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500">ISSUE DATE</p>
                                <p className="text-sm font-bold text-zinc-800 text-right">{issueDate}</p>
                            </div>
                            {isReceipt ? (
                                <>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500">
                                            PAYMENT DATE
                                        </p>
                                        <p className="text-sm font-bold text-zinc-800 text-right">
                                            {invoice?.datePaid
                                                ? format(new Date(invoice.datePaid), 'MMM dd, yyyy')
                                                : issueDate}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500">
                                            PAYMENT METHOD
                                        </p>
                                        <p className="text-sm font-bold text-zinc-800 text-right">
                                            {getPaymentMethodLabel(invoice.paymentMethod)}
                                        </p>
                                    </div>
                                </>
                            ) : hasDueDate ? (
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.12em] text-zinc-500">DUE DATE</p>
                                    <p className="text-sm font-bold text-zinc-800 text-right">
                                        {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </DetailBox>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-xs sm:text-sm border-collapse">
                        <thead>
                            <tr style={{ backgroundColor: lightBrand, color: brandColor }}>
                                <th className="px-2 py-2.5 font-bold text-center w-10">#</th>
                                <th className="px-2 py-2.5 font-bold text-left">DESCRIPTION</th>
                                <th className="px-2 py-2.5 font-bold text-center w-14">QTY</th>
                                <th className="px-2 py-2.5 font-bold text-right w-24">UNIT PRICE</th>
                                <th className="px-2 py-2.5 font-bold text-right w-24">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(invoice?.items || []).map((item, index) => (
                                <tr
                                    key={index}
                                    className={index % 2 === 1 ? 'bg-zinc-50/80' : 'bg-white'}
                                    style={{ borderBottom: '1px solid rgb(229 231 235)' }}
                                >
                                    <td className="px-2 py-2.5 text-center text-zinc-500">{index + 1}</td>
                                    <td className="px-2 py-2.5 text-zinc-800">{item.description}</td>
                                    <td className="px-2 py-2.5 text-center text-zinc-500">{item.quantity}</td>
                                    <td className="px-2 py-2.5 text-right text-zinc-500 whitespace-nowrap">
                                        {formatCurrency(item.rate)}
                                    </td>
                                    <td className="px-2 py-2.5 text-right font-bold text-zinc-800 whitespace-nowrap">
                                        {formatCurrency(Number(item.quantity) * Number(item.rate))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 flex justify-end">
                    <dl className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Subtotal</dt>
                            <dd className="font-bold text-zinc-800">{formatCurrency(invoice.subtotal)}</dd>
                        </div>
                        {Number(invoice.discount) > 0 && (
                            <div className="flex justify-between gap-4">
                                <dt className="text-zinc-500">
                                    {invoice.discountType === 'percent' && invoice.discountValue
                                        ? `Discount (${invoice.discountValue}%)`
                                        : 'Discount'}
                                </dt>
                                <dd className="font-bold text-red-600">
                                    −{formatCurrency(invoice.discount)}
                                </dd>
                            </div>
                        )}
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Tax ({invoice.taxRate ?? 0}%)</dt>
                            <dd className="font-bold text-zinc-800">{formatCurrency(invoice.tax)}</dd>
                        </div>
                        <div className="flex justify-between gap-4 pt-2 border-t border-zinc-200">
                            <dt className="font-bold text-zinc-800">
                                {isReceipt ? 'TOTAL PAID' : 'TOTAL DUE'}
                            </dt>
                            <dd className="text-lg font-bold" style={{ color: brandColor }}>
                                {formatCurrency(invoice.total)}
                            </dd>
                        </div>
                    </dl>
                </div>

                {(showPaymentBox || notesText) && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {showPaymentBox ? (
                            <div className="rounded-lg border border-zinc-200 px-4 py-3">
                                <p
                                    className="text-xs font-bold tracking-[0.08em] mb-2"
                                    style={{ color: brandColor }}
                                >
                                    PAYMENT INFORMATION
                                </p>
                                <div className="space-y-1 text-xs sm:text-sm text-zinc-500 whitespace-pre-wrap">
                                    {paymentLines.map((line) => (
                                        <p key={line}>{line}</p>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                        {notesText ? (
                            <div
                                className={`rounded-lg border border-zinc-200 px-4 py-3 ${showPaymentBox ? '' : 'sm:col-span-2'}`}
                            >
                                <p
                                    className="text-xs font-bold tracking-[0.08em] mb-2"
                                    style={{ color: brandColor }}
                                >
                                    NOTES
                                </p>
                                <p className="text-xs sm:text-sm text-zinc-500 whitespace-pre-wrap">{notesText}</p>
                            </div>
                        ) : null}
                    </div>
                )}

                {(signatureUrl || stampUrl) && (
                    <div className="mt-10 mb-2 flex justify-end">
                        <div className="flex items-end gap-8 sm:gap-10">
                            {signatureUrl ? (
                                <div className="flex flex-col items-center min-w-[140px] max-w-[200px]">
                                    <div className="w-full border-t border-zinc-300 mb-2" />
                                    <img
                                        src={signatureUrl}
                                        alt="Authorized signature"
                                        className="max-h-14 max-w-full object-contain"
                                    />
                                    {businessInfo?.name ? (
                                        <p className="mt-2 text-sm font-semibold text-zinc-800 text-center">
                                            {businessInfo.name}
                                        </p>
                                    ) : null}
                                    <p className="mt-0.5 text-[10px] tracking-wide text-zinc-500 text-center">
                                        Authorized Signature
                                    </p>
                                </div>
                            ) : null}
                            {stampUrl ? (
                                <div className="flex items-center justify-center pb-1">
                                    <img
                                        src={stampUrl}
                                        alt="Company stamp"
                                        className="max-h-[88px] max-w-[88px] object-contain opacity-95"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-4 border-t border-zinc-200 text-center text-xs text-zinc-500">
                    {premium ? (
                        <p>
                            Thank you for doing business with {businessInfo?.name || 'us'}.
                        </p>
                    ) : (
                        <>
                            <p className="font-bold" style={{ color: brandColor }}>
                                Powered by {APP_NAME}
                            </p>
                            <p className="mt-1">{APP_TAGLINE}</p>
                            <p className="mt-2">
                                {FREE_PDF_FOOTER_CTA_PREFIX}
                                <a
                                    href={APP_WEBSITE_URL}
                                    className="underline hover:opacity-80"
                                    style={{ color: brandColor }}
                                >
                                    {APP_DOMAIN}
                                </a>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
