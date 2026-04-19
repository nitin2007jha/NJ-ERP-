// ── GST ─────────────────────────────────────────────────────────────────
export const GST_RATES = [0, 5, 12, 18, 28];

export const GST_CATEGORIES = {
  medicine:  { hsn: '3004', rate: 12 },
  oil:       { hsn: '3304', rate: 18 },
  food:      { hsn: '0402', rate: 5  },
  service:   { sac: '9993', rate: 18 },
  general:   { hsn: '9999', rate: 18 },
};

// ── SaaS Tiers ───────────────────────────────────────────────────────────
export const PLAN_LIMITS = {
  free_trial: {
    label:          'Free Trial',
    color:          '#64748b',
    invoiceLimit:   30,       // per month
    employeeLimit:  2,
    features: {
      analytics:          false,
      unlimitedInvoices:  false,
      bulkPDF:            false,
      recurring:          false,
      voice:              true,
      omnibox:            true,
      whiteLabel:         false,
    },
  },
  pro: {
    label:         'Pro',
    color:         '#059669',
    priceMonthly:  499,
    invoiceLimit:  Infinity,
    employeeLimit: 10,
    features: {
      analytics:          true,
      unlimitedInvoices:  true,
      bulkPDF:            true,
      recurring:          true,
      voice:              true,
      omnibox:            true,
      whiteLabel:         false,
    },
  },
  enterprise: {
    label:         'Enterprise',
    color:         '#7c3aed',
    priceMonthly:  1499,
    invoiceLimit:  Infinity,
    employeeLimit: Infinity,
    features: {
      analytics:          true,
      unlimitedInvoices:  true,
      bulkPDF:            true,
      recurring:          true,
      voice:              true,
      omnibox:            true,
      whiteLabel:         true,
      prioritySupport:    true,
    },
  },
};

// ── Invoice ──────────────────────────────────────────────────────────────
export const DOC_TYPES = ['Tax Invoice', 'Proforma Invoice', 'Quotation', 'Credit Note', 'Debit Note', 'Delivery Challan'];
export const PAYMENT_MODES = ['UPI', 'Cash', 'Card', 'Bank Transfer', 'Cheque', 'Credit'];
export const PAYMENT_STATUSES = ['paid', 'unpaid', 'partial'];

// ── Expense categories ───────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = ['Rent', 'Salary', 'Utilities', 'Supplies', 'Marketing', 'Transport', 'Maintenance', 'Miscellaneous'];

// ── Demo user ────────────────────────────────────────────────────────────
export const DEMO_UID = 'demo_user_001';

// ── Firestore collection paths ────────────────────────────────────────────
export const COL = {
  users:         'users',
  subscriptions: 'subscriptions',
  businesses:    'businesses',
  invoices:      (uid) => `businesses/${uid}/invoices`,
  clients:       (uid) => `businesses/${uid}/clients`,
  products:      (uid) => `businesses/${uid}/products`,
  services:      (uid) => `businesses/${uid}/services`,
  expenses:      (uid) => `businesses/${uid}/expenses`,
  employees:     (uid) => `businesses/${uid}/employees`,
  activityLog:   (uid) => `businesses/${uid}/activity_log`,
};
