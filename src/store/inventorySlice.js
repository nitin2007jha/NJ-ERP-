export const createInventorySlice = (set, get) => ({
  products: [],
  services: [],

  setProducts: (products) => set({ products }, false, 'inventory/setProducts'),
  setServices: (services) => set({ services }, false, 'inventory/setServices'),

  addProduct: (p) =>
    set((s) => ({ products: [p, ...s.products] }), false, 'inventory/addProduct'),

  updateProduct: (id, patch) =>
    set(
      (s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }),
      false,
      'inventory/updateProduct'
    ),

  softDeleteProduct: (id) =>
    set(
      (s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, isDeleted: true } : p)) }),
      false,
      'inventory/softDeleteProduct'
    ),

  adjustStock: (id, delta) =>
    set(
      (s) => ({
        products: s.products.map((p) =>
          p.id === id ? { ...p, stock: Math.max(0, (p.stock || 0) + delta) } : p
        ),
      }),
      false,
      'inventory/adjustStock'
    ),

  addService: (svc) =>
    set((s) => ({ services: [svc, ...s.services] }), false, 'inventory/addService'),

  updateService: (id, patch) =>
    set(
      (s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, ...patch } : sv)) }),
      false,
      'inventory/updateService'
    ),

  softDeleteService: (id) =>
    set(
      (s) => ({ services: s.services.map((sv) => (sv.id === id ? { ...sv, isDeleted: true } : sv)) }),
      false,
      'inventory/softDeleteService'
    ),

  getLowStockProducts: () =>
    get().products.filter((p) => !p.isDeleted && (p.stock || 0) <= (p.lowStockThreshold || 5)),

  searchItems: (query) => {
    const q = (query || '').toLowerCase();
    const { products, services } = get();
    const matchP = products.filter(
      (p) => !p.isDeleted && ((p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
    );
    const matchS = services.filter(
      (s) => !s.isDeleted && ((s.name || '').toLowerCase().includes(q) || (s.category || '').toLowerCase().includes(q))
    );
    return [...matchP, ...matchS];
  },
});
