/**
 * Central Zustand store.
 * Each slice lives in its own file and is merged here.
 * Usage anywhere: import { useAppStore } from '@/store'
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createAuthSlice }         from './authSlice';
import { createInvoiceSlice }      from './invoiceSlice';
import { createInventorySlice }    from './inventorySlice';
import { createCRMSlice }          from './crmSlice';
import { createExpenseSlice }      from './expenseSlice';
import { createSubscriptionSlice } from './subscriptionSlice';
import { createUISlice }           from './uiSlice';

export const useAppStore = create(
  devtools(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createInvoiceSlice(...args),
      ...createInventorySlice(...args),
      ...createCRMSlice(...args),
      ...createExpenseSlice(...args),
      ...createSubscriptionSlice(...args),
      ...createUISlice(...args),
    }),
    { name: 'MyBusinessERP' }
  )
);

// ── Typed selectors (use these in components for clarity) ─────────────────
export const useAuth         = () => useAppStore((s) => ({ user: s.user, isEmployee: s.isEmployee, permissions: s.permissions, isDemo: s.isDemo }));
export const useInvoices     = () => useAppStore((s) => ({ invoices: s.invoices, draft: s.draft, filters: s.filters }));
export const useInventory    = () => useAppStore((s) => ({ products: s.products, services: s.services }));
export const useCRM          = () => useAppStore((s) => ({ clients: s.clients }));
export const useExpenses     = () => useAppStore((s) => ({ expenses: s.expenses }));
export const useSubscription = () => useAppStore((s) => ({ subscription: s.subscription, can: s.can }));
export const useUI           = () => useAppStore((s) => ({ activeTab: s.activeTab, setTab: s.setTab, toasts: s.toasts, addToast: s.addToast }));
