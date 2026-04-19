/**
 * Invoice ID generation utilities.
 * Mirrors the existing getNextInvoiceId logic from the monolith.
 */

/**
 * Get next invoice ID based on existing invoices array.
 * @param {Array}  invoices  - existing invoices from store
 * @param {string} prefix    - e.g. "INV-", "QUO-", "PRO-"
 * @returns {string}         - e.g. "INV-042"
 */
export function getNextInvoiceId(invoices = [], prefix = 'INV-') {
  let max = 0;
  invoices.forEach((inv) => {
    if ((inv.id || '').startsWith(prefix)) {
      const n = parseInt(inv.id.slice(prefix.length), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  });
  return prefix + String(max + 1).padStart(3, '0');
}

/** Map docType to ID prefix */
export function prefixForDocType(docType = 'Tax Invoice') {
  const map = {
    'Tax Invoice':       'INV-',
    'Proforma Invoice':  'PRO-',
    'Quotation':         'QUO-',
    'Credit Note':       'CRN-',
    'Debit Note':        'DBN-',
    'Delivery Challan':  'DCH-',
  };
  return map[docType] || 'INV-';
}
