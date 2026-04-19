import { calcGST } from '@/utils/gst';

const BLANK_DRAFT = () => ({
  id:            '',
  date:          new Date().toISOString().slice(0, 10),
  docType:       'Tax Invoice',
  currency:      'INR',
  client:        { name: '', mobile: '', gstin: '', address: '' },
  items:         [],
  discount:      0,
  discountType:  'fixed',   // 'fixed' | 'percent'
  tds:           0,
  isRcm:         false,
  paymentMode:   'UPI',
  paymentStatus: 'unpaid',
  notes:         '',
  dueDate:       '',
  poNo:          '',
  vehicleNo:     '',
  ewayBill:      '',
});

export const createInvoiceSlice = (set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────
  invoices: [],
  draft:    BLANK_DRAFT(),
  filters:  { query: '', startDate: '', endDate: '', paymentStatus: '' },

  // ── Invoice CRUD ────────────────────────────────────────────────────────
  setInvoices: (invoices) => set({ invoices }, false, 'invoice/setInvoices'),

  addInvoice: (inv) =>
    set((s) => ({ invoices: [inv, ...s.invoices] }), false, 'invoice/addInvoice'),

  updateInvoice: (id, patch) =>
    set(
      (s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) }),
      false,
      'invoice/updateInvoice'
    ),

  removeInvoice: (id) =>
    set(
      (s) => ({ invoices: s.invoices.filter((i) => i.id !== id) }),
      false,
      'invoice/removeInvoice'
    ),

  // ── Draft management ────────────────────────────────────────────────────
  resetDraft: () => set({ draft: BLANK_DRAFT() }, false, 'invoice/resetDraft'),

  patchDraft: (patch) =>
    set((s) => ({ draft: { ...s.draft, ...patch } }), false, 'invoice/patchDraft'),

  setDraftClient: (client) =>
    set((s) => ({ draft: { ...s.draft, client } }), false, 'invoice/setDraftClient'),

  addDraftItem: (item) =>
    set(
      (s) => ({
        draft: { ...s.draft, items: [...s.draft.items, { ...item, _id: Date.now() }] },
      }),
      false,
      'invoice/addDraftItem'
    ),

  updateDraftItem: (idx, patch) =>
    set(
      (s) => ({
        draft: {
          ...s.draft,
          items: s.draft.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
        },
      }),
      false,
      'invoice/updateDraftItem'
    ),

  removeDraftItem: (idx) =>
    set(
      (s) => ({ draft: { ...s.draft, items: s.draft.items.filter((_, i) => i !== idx) } }),
      false,
      'invoice/removeDraftItem'
    ),

  // ── Computed totals (call this to get subtotal, tax, grand) ─────────────
  getDraftTotals: () => {
    const { draft } = get();
    const subtotal = draft.items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0);
    const totalTax = draft.items.reduce((s, it) => {
      const lineAmt = (it.qty || 0) * (it.rate || 0);
      return s + calcGST(lineAmt, it.gst || 0).tax;
    }, 0);
    let discount = 0;
    if (draft.discountType === 'percent') discount = (subtotal * (draft.discount || 0)) / 100;
    else discount = draft.discount || 0;
    const grandTotal = subtotal + totalTax - discount - (draft.tds || 0);
    return { subtotal, totalTax, discount, grandTotal: Math.max(0, grandTotal) };
  },

  // ── Filters ─────────────────────────────────────────────────────────────
  setFilters: (filters) =>
    set((s) => ({ filters: { ...s.filters, ...filters } }), false, 'invoice/setFilters'),

  getFilteredInvoices: () => {
    const { invoices, filters } = get();
    const q = filters.query.toLowerCase();
    return invoices.filter((inv) => {
      const matchQuery =
        !q ||
        (inv.id || '').toLowerCase().includes(q) ||
        (inv.client?.name || '').toLowerCase().includes(q);
      const matchStart = !filters.startDate || inv.date >= filters.startDate;
      const matchEnd   = !filters.endDate   || inv.date <= filters.endDate;
      const matchPay   = !filters.paymentStatus || inv.paymentStatus === filters.paymentStatus;
      return matchQuery && matchStart && matchEnd && matchPay;
    });
  },
});
