import { format } from 'date-fns';
import { escapeHtml, formatMoney, wrapHtml } from './htmlUtils';

export function buildStatementHtml(statement, businessInfo) {
    const currency = businessInfo?.defaultCurrency || 'NGN';
    const brand = businessInfo?.brandColor || '#16A34A';

    const summaryRows = [
        ['Paid', statement.totals.paid],
        ['Balance', statement.totals.partial],
        ['Pending', statement.totals.pending],
        ['Overdue', statement.totals.overdue],
        ['Cancelled', statement.totals.cancelled],
        ['Total billed', statement.totals.total],
    ]
        .map(
            ([label, val]) => `
      <tr>
        <td>${escapeHtml(label)}</td>
        <td style="text-align:right">${escapeHtml(formatMoney(val, currency))}</td>
      </tr>`
        )
        .join('');

    const clientRows = statement.rows
        .map(
            (row) => `
      <tr>
        <td>${escapeHtml(row.clientName)}</td>
        <td class="num">${escapeHtml(formatMoney(row.paid, currency))}</td>
        <td class="num">${escapeHtml(formatMoney(row.partial, currency))}</td>
        <td class="num">${escapeHtml(formatMoney(row.pending, currency))}</td>
        <td class="num">${escapeHtml(formatMoney(row.total, currency))}</td>
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
          <th class="num">Balance</th>
          <th class="num">Pending</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>${clientRows}</tbody>
    </table>`;

    return wrapHtml(body, `Statement ${statement.periodLabel}`);
}
