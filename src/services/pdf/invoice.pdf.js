import { rupee, formatINR, amountToWords } from '@/utils/gst';
import { formatIN } from '@/utils/date';

/**
 * Generate HTML string for a single invoice.
 * This HTML is used both for PDF export and QR-code viewer.
 */
export function generateInvoiceHTML(invoice, settings = {}) {
  const biz   = settings;
  const items = invoice.items || [];

  const subtotal  = items.reduce((s, i) => s + (i.qty || 0) * (i.rate || 0), 0);
  const totalTax  = items.reduce((s, i) => {
    const amt = (i.qty || 0) * (i.rate || 0);
    return s + (amt * (i.gst || 0)) / 100;
  }, 0);
  const grand     = invoice.grandTotal || subtotal + totalTax;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Arial',sans-serif; color:#0f172a; background:#fff; font-size:12px; }
  .inv { width:794px; min-height:1123px; padding:40px; background:#fff; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; }
  .biz-name { font-size:22px; font-weight:800; color:#059669; }
  .biz-info { font-size:10px; color:#64748b; margin-top:4px; line-height:1.6; }
  .inv-meta { text-align:right; }
  .inv-title { font-size:18px; font-weight:700; color:#0f172a; }
  .inv-num { font-size:13px; font-weight:700; color:#059669; margin-top:4px; }
  .inv-date { font-size:11px; color:#64748b; margin-top:2px; }
  .divider { border:none; border-top:2px solid #059669; margin:16px 0; }
  .client-section { display:flex; justify-content:space-between; margin-bottom:20px; }
  .client-box { background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px 16px; width:48%; }
  .box-label { font-size:9px; font-weight:800; color:#94a3b8; text-transform:uppercase; letter-spacing:.08em; margin-bottom:6px; }
  .box-name { font-size:14px; font-weight:700; color:#0f172a; }
  .box-detail { font-size:10px; color:#64748b; margin-top:2px; line-height:1.5; }
  table { width:100%; border-collapse:collapse; margin-bottom:16px; }
  th { background:#f1f5f9; padding:8px 10px; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.04em; text-align:left; border-bottom:2px solid #e2e8f0; }
  td { padding:9px 10px; font-size:11px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
  tr:last-child td { border-bottom:none; }
  .text-right { text-align:right; }
  .totals { margin-left:auto; width:280px; }
  .total-row { display:flex; justify-content:space-between; padding:4px 0; font-size:11px; color:#475569; }
  .total-row.grand { border-top:2px solid #059669; margin-top:6px; padding-top:8px; font-size:14px; font-weight:800; color:#059669; }
  .words { margin-top:8px; padding:10px 14px; background:#f0fdf4; border:1px solid #bbf7d0; border-radius:6px; font-size:10px; color:#166534; font-weight:600; }
  .footer { margin-top:32px; display:flex; justify-content:space-between; align-items:flex-end; }
  .terms { font-size:9px; color:#94a3b8; max-width:60%; line-height:1.5; }
  .sign-box { text-align:center; }
  .sign-line { border-top:1px solid #0f172a; width:160px; margin:0 auto; padding-top:6px; font-size:10px; font-weight:700; }
  .status-badge { display:inline-block; padding:3px 10px; border-radius:20px; font-size:10px; font-weight:700; margin-top:4px; }
  .paid { background:#dcfce7; color:#166534; }
  .unpaid { background:#fef3c7; color:#92400e; }
</style>
</head>
<body>
<div class="inv inv-id-tracker" data-id="${invoice.id || ''}">
  <div class="header">
    <div>
      <div class="biz-name">${biz.businessName || 'My Business'}</div>
      <div class="biz-info">
        ${biz.address ? biz.address + '<br>' : ''}
        ${biz.phone   ? 'Ph: ' + biz.phone  : ''}
        ${biz.gstin   ? ' | GSTIN: ' + biz.gstin : ''}
        ${biz.email   ? '<br>' + biz.email : ''}
      </div>
    </div>
    <div class="inv-meta">
      <div class="inv-title">${invoice.docType || 'Tax Invoice'}</div>
      <div class="inv-num">#${invoice.id || ''}</div>
      <div class="inv-date">Date: ${formatIN(invoice.date)}</div>
      ${invoice.dueDate ? `<div class="inv-date">Due: ${formatIN(invoice.dueDate)}</div>` : ''}
      <span class="status-badge ${invoice.paymentStatus === 'paid' ? 'paid' : 'unpaid'}">
        ${(invoice.paymentStatus || 'unpaid').toUpperCase()}
      </span>
    </div>
  </div>

  <hr class="divider">

  <div class="client-section">
    <div class="client-box">
      <div class="box-label">Bill To</div>
      <div class="box-name">${invoice.client?.name || '—'}</div>
      <div class="box-detail">
        ${invoice.client?.mobile  ? 'Ph: ' + invoice.client.mobile : ''}
        ${invoice.client?.gstin   ? '<br>GSTIN: ' + invoice.client.gstin : ''}
        ${invoice.client?.address ? '<br>' + invoice.client.address : ''}
      </div>
    </div>
    <div class="client-box">
      <div class="box-label">Payment</div>
      <div class="box-name">${invoice.paymentMode || '—'}</div>
      ${biz.upi  ? `<div class="box-detail">UPI: ${biz.upi}</div>` : ''}
      ${biz.bankName ? `<div class="box-detail">${biz.bankName}<br>A/C: ${biz.bankAcc || ''}<br>IFSC: ${biz.bankIfsc || ''}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item / Description</th>
        <th>HSN/SAC</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Rate</th>
        <th class="text-right">GST%</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((it, i) => {
        const amt = (it.qty || 0) * (it.rate || 0);
        const tax = (amt * (it.gst || 0)) / 100;
        return `<tr>
          <td>${i + 1}</td>
          <td><strong>${it.name || ''}</strong></td>
          <td>${it.hsn || ''}</td>
          <td class="text-right">${it.qty || 0}</td>
          <td class="text-right">₹${formatINR(it.rate)}</td>
          <td class="text-right">${it.gst || 0}%</td>
          <td class="text-right">₹${formatINR(amt + tax)}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>₹${formatINR(subtotal)}</span></div>
    <div class="total-row"><span>GST (CGST+SGST)</span><span>₹${formatINR(totalTax)}</span></div>
    ${invoice.discount ? `<div class="total-row"><span>Discount</span><span>-₹${formatINR(invoice.discount)}</span></div>` : ''}
    ${invoice.tds ? `<div class="total-row"><span>TDS</span><span>-₹${formatINR(invoice.tds)}</span></div>` : ''}
    <div class="total-row grand"><span>Grand Total</span><span>₹${formatINR(grand)}</span></div>
  </div>

  <div class="words">${amountToWords(grand)}</div>

  <div class="footer">
    <div class="terms">
      <strong>Terms & Conditions</strong><br>
      ${biz.customTerms || 'Thank you for your business!'}
    </div>
    <div class="sign-box">
      <div class="sign-line">Authorised Signatory<br>${biz.businessName || ''}</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

/**
 * Export a single invoice as PDF using html2pdf.js
 */
export async function exportInvoicePDF(invoice, settings) {
  const html2pdf = (await import('html2pdf.js')).default;
  const html     = generateInvoiceHTML(invoice, settings);

  const container = document.createElement('div');
  // KEY: position off-screen, NOT z-index:-9999 (causes blank PDF on Android)
  container.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:1;clip-path:inset(0);';
  container.innerHTML = html;
  document.body.appendChild(container);

  await new Promise((res) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(res, 400)))
  );

  try {
    await html2pdf()
      .set({
        margin:      0,
        filename:    `${invoice.id || 'Invoice'}.pdf`,
        image:       { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794, windowWidth: 794,
          x: 0, y: 0, scrollX: 0, scrollY: 0, logging: false,
          onclone: (cloned) => {
            const el = cloned.querySelector('[data-id]');
            if (el) { el.style.left = '0'; el.style.position = 'absolute'; }
          },
        },
        jsPDF:       { unit: 'pt', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save();
  } finally {
    container.remove();
  }
}
