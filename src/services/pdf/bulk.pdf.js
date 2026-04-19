import { generateInvoiceHTML } from './invoice.pdf';

/**
 * Bulk export multiple invoices as a single multi-page PDF.
 * Fix applied: off-screen via left:-9999px (NOT z-index:-9999)
 * which caused blank 3kb PDFs on Android Chrome.
 */
export async function exportBulkPDF(invoices, settings, onProgress) {
  if (!invoices.length) return;

  const html2pdf = (await import('html2pdf.js')).default;

  const styleEl = document.createElement('style');
  styleEl.id    = 'bulk-pdf-style';
  styleEl.textContent = `
    #bulk-pdf-root * { box-sizing: border-box !important; }
    .bulk-page {
      width: 794px !important;
      min-height: 1123px !important;
      background: #fff !important;
      page-break-after: always !important;
      break-after: page !important;
      position: relative !important;
      overflow: hidden !important;
    }
  `;
  document.head.appendChild(styleEl);

  const root = document.createElement('div');
  root.id    = 'bulk-pdf-root';
  root.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:1;clip-path:inset(0);overflow:visible;';

  invoices.forEach((inv, idx) => {
    onProgress && onProgress(idx + 1, invoices.length);
    const page       = document.createElement('div');
    page.className   = 'bulk-page';
    page.innerHTML   = generateInvoiceHTML(inv, settings);
    root.appendChild(page);
  });

  document.body.appendChild(root);

  // Wait for browser to paint all pages
  await new Promise((res) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(res, 1000)))
  );

  try {
    await html2pdf()
      .set({
        margin:      0,
        filename:    `Bulk_Invoices_${Date.now()}.pdf`,
        image:       { type: 'jpeg', quality: 0.97 },
        html2canvas: {
          scale: 2, useCORS: true, allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794, windowWidth: 794,
          x: 0, y: 0, scrollX: 0, scrollY: 0, logging: false,
          onclone: (cloned) => {
            const r = cloned.getElementById('bulk-pdf-root');
            if (r) { r.style.left = '0'; r.style.position = 'absolute'; }
          },
        },
        jsPDF:       { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak:   { mode: ['css', 'legacy'] },
      })
      .from(root)
      .save();
  } finally {
    styleEl.remove();
    root.remove();
  }
}
