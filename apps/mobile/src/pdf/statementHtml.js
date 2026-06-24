import { format } from 'date-fns';
import { getCurrencySymbol } from '@waraqah/shared';
import { escapeHtml, formatMoney, wrapHtml } from './htmlUtils';

export function buildStatementHtml(statement, businessInfo) {
    const symbol = getCurrencySymbol(false);
    const brand = businessInfo?.brandColor || '#0284c7';

    const summaryRows = [
        ['Paid', statement.totals.paid],
        ['Pending', statement.totals.pending],
        ['Overdue', statement.totals.overdue],
        ['Cancelled', statement.totals.cancelled],
        ['Total billed', statement.totals.total],
    ]
        .map(
            ([label, val]) => `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td style="text-align:right">${escapeHtml(formatMoney(val, symbol))}</td>
      </tr>`
        )
        .join('');

    const clientRows = statement.rows
        .map(
            (row) => `
      <tr>
        <td>${escapeHtml(row.clientName)}</td>
        <td class="num">${escapeHtml(formatMoney(row.paid, symbol))}</td>
        <td class="num">${escapeHtml(formatMoney(row.pending, symbol))}</td>
        <td class="num">${escapeHtml(formatMoney(row.total, symbol))}</td>
      </tr>`
        )
        .join('');

    const body = `
    <div class="brand-bar" style="background:${escapeHtml(brand)}"></div>
    <h1 class="business-name">${escapeHtml(businessInfo?.name || 'Business')}</h1>
    <p class="muted">Monthly billing statement — ${escapeHtml(statement.periodLabel)}</p>
    <p class="muted">Generated: ${escapeHtml(format(statement.generatedAt, 'MMM d, yyyy'))}</p>

    <div class="section-title">Summary</div>
    <table>${summaryRows}</table>

    <div class="section-title">By client</div>
    <table>
      <thead>
        <tr style="background:${escapeHtml(brand)}">
          <th>Client</th>
          <th class="num">Paid</th>
          <th class="num">Pending</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>${clientRows}</tbody>
    </table>

    <div class="footer">
      Amounts grouped by invoice status for ${escapeHtml(statement.periodLabel)}.
    </div>`;

    return wrapHtml(body, `Statement ${statement.periodLabel}`);
}
