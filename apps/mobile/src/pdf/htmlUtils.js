export function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export function formatMoney(value, symbol) {
    return `${symbol} ${Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

export function wrapHtml(body, title = 'Document') {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
    color: #1f2937;
    font-size: 11px;
    line-height: 1.45;
    margin: 0;
    padding: 32px;
    position: relative;
  }
  .paid-stamp {
    position: absolute;
    left: 50%;
    top: 42%;
    transform: translate(-50%, -50%) rotate(-20deg);
    font-size: 40px;
    font-weight: 800;
    letter-spacing: 0.14em;
    color: rgba(34, 197, 94, 0.18);
    border: 3px double rgba(34, 197, 94, 0.22);
    border-radius: 10px;
    padding: 10px 28px;
    pointer-events: none;
    z-index: 10;
  }
  .brand-bar { height: 4px; margin: -32px -32px 20px; }
  .header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
  .business-name { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
  .muted { color: #6b7280; margin: 2px 0; }
  .doc-title { font-size: 28px; font-weight: 700; text-align: right; margin: 0; }
  .doc-num {
    display: inline-block;
    margin-top: 8px;
    padding: 6px 10px;
    background: #e0f2fe;
    border-radius: 4px;
    font-weight: 700;
    float: right;
  }
  .info-row { display: flex; gap: 12px; margin-bottom: 16px; }
  .info-box { flex: 1; background: #f1f5f9; border-radius: 6px; padding: 10px; }
  .info-label { font-size: 8px; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
  th { color: #fff; font-size: 9px; letter-spacing: 0.03em; }
  td.num, th.num { text-align: center; }
  .totals { width: 45%; margin-left: auto; margin-top: 12px; }
  .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .total-bold { font-weight: 700; font-size: 12px; }
  .footer {
    margin-top: 32px;
    padding-top: 8px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-size: 10px;
  }
  .section-title { font-weight: 700; font-size: 12px; margin: 16px 0 8px; }
</style>
</head>
<body>${body}</body>
</html>`;
}
