import { format } from 'date-fns';
import {
    getCurrencySymbol,
    getDocumentNumber,
    FREE_PDF_FOOTER_CTA_PREFIX,
    isPremiumUser,
    getAuthorizedSignatureUrl,
    resolveQuantityColumnLabel,
    DEFAULT_QUOTATION_TERMS,
} from '@waraqah/shared';
import { escapeHtml, formatMoney, wrapHtml } from './htmlUtils';
import { APP_DOMAIN, APP_NAME, APP_TAGLINE, APP_WEBSITE_URL } from '../constants/brand';

export function buildQuotationHtml(quotation, client, businessInfo) {
    const premium = isPremiumUser(businessInfo);
    const brand = businessInfo?.brandColor || '#16A34A';
    const symbol = getCurrencySymbol(quotation?.currency || 'NGN', false);
    const docNumber = getDocumentNumber(quotation, 'quotation');
    const signatureUrl = premium ? getAuthorizedSignatureUrl(businessInfo) : '';
    const ownerName = String(businessInfo?.name || '').trim();
    const businessName = String(businessInfo?.name || 'us').trim() || 'us';
    const quantityColumnLabel = escapeHtml(
        resolveQuantityColumnLabel(quotation?.items).toUpperCase()
    );
    const terms = String(quotation?.terms || DEFAULT_QUOTATION_TERMS).trim();

    const itemRows = (quotation?.items || [])
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

    let signatureHtml = '';
    if (signatureUrl) {
        signatureHtml = `<div class="sig-stamp-row">
        <div class="sig-block">
          <div class="sig-rule"></div>
          <img class="sig-img" src="${escapeHtml(signatureUrl)}" alt="Authorized signature" />
          ${ownerName ? `<p class="sig-name">${escapeHtml(ownerName)}</p>` : ''}
          <p class="sig-label">Authorized Signature</p>
        </div>
      </div>`;
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
        <h1 class="doc-title" style="color:${escapeHtml(brand)}">QUOTATION</h1>
        <div class="doc-num" style="color:${escapeHtml(brand)}">#${escapeHtml(docNumber)}</div>
      </div>
    </div>
    <div class="info-row">
      <div class="info-box">
        <div class="info-label" style="color:${escapeHtml(brand)}">QUOTED TO</div>
        <strong>${escapeHtml(client?.name)}</strong>
        <p class="muted">${escapeHtml(client?.email)}</p>
        ${client?.phone ? `<p class="muted">${escapeHtml(client.phone)}</p>` : ''}
      </div>
      <div class="info-box">
        <div class="info-label" style="color:${escapeHtml(brand)}">ISSUE DATE</div>
        <p>${quotation?.date ? escapeHtml(format(new Date(quotation.date), 'MMM dd, yyyy')) : 'N/A'}</p>
        ${
            quotation?.validUntil
                ? `<div class="info-label" style="color:${escapeHtml(brand)};margin-top:8px">VALID UNTIL</div>
           <p>${escapeHtml(format(new Date(quotation.validUntil), 'MMM dd, yyyy'))}</p>`
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
      <div class="total-row"><span>Subtotal</span><span>${escapeHtml(formatMoney(quotation.subtotal, symbol))}</span></div>
      <div class="total-row"><span>Tax (${escapeHtml(quotation.taxRate ?? 0)}%)</span><span>${escapeHtml(formatMoney(quotation.tax, symbol))}</span></div>
      <div class="total-row total-bold"><span>Total</span><span>${escapeHtml(formatMoney(quotation.total, symbol))}</span></div>
      <div class="total-row total-bold" style="color:${escapeHtml(brand)}">
        <span>ESTIMATED TOTAL</span>
        <span>${escapeHtml(formatMoney(quotation.total, symbol))}</span>
      </div>
    </div>
    ${
        quotation?.notes
            ? `<div class="section-title" style="color:${escapeHtml(brand)}">NOTES</div><p class="muted">${escapeHtml(quotation.notes)}</p>`
            : ''
    }
    ${
        terms
            ? `<div class="section-title" style="color:${escapeHtml(brand)}">TERMS &amp; CONDITIONS</div><p class="muted" style="white-space:pre-wrap">${escapeHtml(terms)}</p>`
            : ''
    }
    ${signatureHtml}
    <div class="footer">
      <p>Thank you for considering ${escapeHtml(businessName)}. We look forward to doing business with you.</p>
      <p style="font-size:8px;margin-top:4px">${escapeHtml(businessInfo?.name)} • ${escapeHtml(businessInfo?.email)} • ${escapeHtml(businessInfo?.phone)}</p>
      ${premium ? '' : freeFooter}
    </div>`;

    return wrapHtml(body, `Quotation ${docNumber}`);
}
