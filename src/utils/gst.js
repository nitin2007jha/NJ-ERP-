/**
 * GST calculation utilities.
 * All functions are pure — no side effects.
 */

/** Calculate GST components for a line amount */
export function calcGST(amount, ratePercent) {
  const rate = Number(ratePercent) || 0;
  const tax  = (amount * rate) / 100;
  return {
    tax,
    cgst:  tax / 2,
    sgst:  tax / 2,
    igst:  0,       // set to tax for inter-state
    total: amount + tax,
  };
}

/** Format as Indian Rupees */
export function formatINR(value) {
  return Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/** Format with ₹ symbol */
export function rupee(value) {
  return '₹' + formatINR(value);
}

/** Round to 2 decimal places */
export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

/** Convert amount to words (Indian style) */
export function amountToWords(amount) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function words(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + words(n % 100);
    if (n < 100000) return words(Math.floor(n / 1000)) + 'Thousand ' + words(n % 1000);
    if (n < 10000000) return words(Math.floor(n / 100000)) + 'Lakh ' + words(n % 100000);
    return words(Math.floor(n / 10000000)) + 'Crore ' + words(n % 10000000);
  }

  const n = Math.floor(Number(amount) || 0);
  const paise = Math.round((Number(amount) % 1) * 100);
  let result = words(n).trim() + ' Rupees';
  if (paise > 0) result += ' and ' + words(paise).trim() + ' Paise';
  return result + ' Only';
}
