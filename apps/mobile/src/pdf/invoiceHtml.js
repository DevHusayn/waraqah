import { format } from 'date-fns';
import {
    getCurrencySymbol,
    getDocumentNumber,
    getPaymentMethodLabel,
    FREE_PDF_FOOTER_CTA_PREFIX,
    isPremiumUser,
    resolvePdfMode,
    getCompanyStampUrl,
    getAuthorizedSignatureUrl,
    resolveQuantityColumnLabel,
} from '@waraqah/shared';
import { escapeHtml, formatMoney, wrapHtml } from './htmlUtils';
import { APP_DOMAIN, APP_NAME, APP_TAGLINE, APP_WEBSITE_URL } from '../constants/brand';

export function buildInvoiceHtml(invoice, client, businessInfo, mode = 'auto') {
    const resolvedMode = resolvePdfMode(invoice, mode);
    const isReceipt = resolvedMode === 'receipt';
    const premium = isPremiumUser(businessInfo);
    const brand = businessInfo?.brandColor || '#16A34A';
    const symbol = getCurrencySymbol(false);
    const docNumber = getDocumentNumber(invoice, resolvedMode);
    const signatureUrl = premium ? getAuthorizedSignatureUrl(businessInfo) : '';
    const stampUrl = premium && isReceipt ? getCompanyStampUrl(businessInfo) : '';
    const ownerName = String(businessInfo?.name || '').trim();
    const quantityColumnLabel = escapeHtml(
        resolveQuantityColumnLabel(invoice?.items).toUpperCase()
    );

    const itemRows = (invoice?.items || [])
        .map(
            (item) => `
      <tr>
        <td>${escapeHtml(item.description)}</td>
        <td class="num">${escapeHtml(item.quantity)}</td>
        <td class="num">${escapeHtml(formatMoney(item.rate, symbol))}</td>
        <td class="num"><strong>${escapeHtml(formatMoney(Number(item.quantity) * Number(item.rate), symbol))}</strong></td>
      </tr>`
        )
        .join('');

    const freeFooter = `
      <p class="muted" style="margin-top:8px">Powered by ${escapeHtml(APP_NAME)}</p>
      <p class="muted" style="font-size:9px">${escapeHtml(APP_TAGLINE)}</p>
      <p style="margin-top:6px">${escapeHtml(FREE_PDF_FOOTER_CTA_PREFIX)}<a href="${escapeHtml(APP_WEBSITE_URL)}">${escapeHtml(APP_DOMAIN)}</a></p>`;

    let signatureStampHtml = '';
    if (signatureUrl || stampUrl) {
        const signatureBlock = signatureUrl
            ? `<div class="sig-block">
          <div class="sig-rule"></div>
          <img class="sig-img" src="${escapeHtml(signatureUrl)}" alt="Authorized signature" />
          ${ownerName ? `<p class="sig-name">${escapeHtml(ownerName)}</p>` : ''}
          <p class="sig-label">Authorized Signature</p>
        </div>`
            : '';
        const stampBlock = stampUrl
            ? `<div class="stamp-block">
          <img class="stamp-img" src="${escapeHtml(stampUrl)}" alt="Company stamp" />
        </div>`
            : '';
        signatureStampHtml = `<div class="sig-stamp-row">${signatureBlock}${stampBlock}</div>`;
    }

    const body = `
    <div class="brand-bar" style="background:${escapeHtml(brand)}"></div>
    <div class="header">
      <div>
        <p class="business-name">${escapeHtml(businessInfo?.name || 'Business')}</p>
        <p class="muted">${escapeHtml(businessInfo?.address)}</p>
        <p class="muted">${escapeHtml(businessInfo?.email)}</p>
        <p class="muted">${escapeHtml(businessInfo?.phone)}</p>
      </div>
      <div>
        <h1 class="doc-title" style="color:${escapeHtml(brand)}">${isReceipt ? 'RECEIPT' : 'INVOICE'}</h1>
        <div class="doc-num" style="color:${escapeHtml(brand)}">#${escapeHtml(docNumber)}</div>
      </div>
    </div>
    <div class="info-row">
      <div class="info-box">
        <div class="info-label" style="color:${escapeHtml(brand)}">BILLED TO</div>
        <strong>${escapeHtml(client?.name)}</strong>
        <p class="muted">${escapeHtml(client?.email)}</p>
        ${client?.phone ? `<p class="muted">${escapeHtml(client.phone)}</p>` : ''}
      </div>
      <div class="info-box">
        <div class="info-label" style="color:${escapeHtml(brand)}">ISSUE DATE</div>
        <p>${invoice?.date ? escapeHtml(format(new Date(invoice.date), 'MMM dd, yyyy')) : 'N/A'}</p>
        ${
            isReceipt
                ? `<div class="info-label" style="color:${escapeHtml(brand)};margin-top:8px">PAYMENT METHOD</div>
           <p>${escapeHtml(getPaymentMethodLabel(invoice.paymentMethod))}</p>`
                : invoice?.dueDate
                  ? `<div class="info-label" style="color:${escapeHtml(brand)};margin-top:8px">DUE DATE</div>
           <p>${escapeHtml(format(new Date(invoice.dueDate), 'MMM dd, yyyy'))}</p>`
                  : ''
        }
      </div>
    </div>
    <table>
      <thead>
        <tr style="background:${escapeHtml(brand)}">
          <th>DESCRIPTION</th>
          <th class="num">${quantityColumnLabel}</th>
          <th class="num">RATE</th>
          <th class="num">AMOUNT</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div class="totals">
      <div class="total-row"><span>Subtotal</span><span>${escapeHtml(formatMoney(invoice.subtotal, symbol))}</span></div>
      <div class="total-row"><span>Tax (${escapeHtml(invoice.taxRate ?? 0)}%)</span><span>${escapeHtml(formatMoney(invoice.tax, symbol))}</span></div>
      <div class="total-row total-bold"><span>Total</span><span>${escapeHtml(formatMoney(invoice.total, symbol))}</span></div>
      <div class="total-row total-bold" style="color:${escapeHtml(brand)}">
        <span>${isReceipt ? 'TOTAL PAID' : 'TOTAL DUE'}</span>
        <span>${escapeHtml(formatMoney(invoice.total, symbol))}</span>
      </div>
    </div>
    ${
        invoice?.notes
            ? `<div class="section-title" style="color:${escapeHtml(brand)}">NOTES</div><p class="muted">${escapeHtml(invoice.notes)}</p>`
            : ''
    }
    ${signatureStampHtml}
    <div class="footer">
      <p>${isReceipt ? 'Payment received. Thank you!' : 'Thank you for your business!'}</p>
      <p style="font-size:8px;margin-top:4px">${escapeHtml(businessInfo?.name)} • ${escapeHtml(businessInfo?.email)} • ${escapeHtml(businessInfo?.phone)}</p>
      ${premium ? '' : freeFooter}
    </div>`;

    return wrapHtml(body, isReceipt ? `Receipt ${docNumber}` : `Invoice ${docNumber}`);
}
