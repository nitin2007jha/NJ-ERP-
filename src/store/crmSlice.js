export const createCRMSlice = (set, get) => ({
  clients: [],

  setClients: (clients) => set({ clients }, false, 'crm/setClients'),

  addClient: (c) =>
    set((s) => ({ clients: [c, ...s.clients] }), false, 'crm/addClient'),

  updateClient: (id, patch) =>
    set(
      (s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) }),
      false,
      'crm/updateClient'
    ),

  softDeleteClient: (id) =>
    set(
      (s) => ({ clients: s.clients.map((c) => (c.id === id ? { ...c, isDeleted: true } : c)) }),
      false,
      'crm/softDeleteClient'
    ),

  addJournalEntry: (clientId, entry) =>
    set(
      (s) => ({
        clients: s.clients.map((c) =>
          c.id === clientId
            ? { ...c, journal: [...(c.journal || []), { ...entry, id: Date.now().toString() }] }
            : c
        ),
      }),
      false,
      'crm/addJournalEntry'
    ),

  /** Returns pending balance for a client across all invoices in invoiceSlice */
  getClientBalance: (clientName) => {
    const invoices = get().invoices || [];
    return invoices
      .filter(
        (i) =>
          i.client?.name === clientName &&
          i.paymentStatus !== 'paid' &&
          i.status === 'final'
      )
      .reduce((sum, i) => sum + (i.grandTotal || 0), 0);
  },

  searchClients: (query) => {
    const q = (query || '').toLowerCase();
    return get()
      .clients.filter((c) => !c.isDeleted)
      .filter(
        (c) =>
          (c.name || '').toLowerCase().includes(q) ||
          (c.mobile || '').includes(q) ||
          (c.gstin || '').toLowerCase().includes(q)
      );
  },
});
