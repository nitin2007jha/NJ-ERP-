import { PLAN_LIMITS } from '@/config/constants';

const FREE = {
  tier:     'free_trial',
  status:   'active',
  features: PLAN_LIMITS.free_trial.features,
};

export const createSubscriptionSlice = (set, get) => ({
  subscription: FREE,

  setSubscription: (sub) => {
    const tier     = sub?.tier || 'free_trial';
    const features = {
      ...(PLAN_LIMITS[tier]?.features || PLAN_LIMITS.free_trial.features),
      ...(sub?.features || {}),           // per-user overrides from Firestore
    };
    set({ subscription: { ...sub, features } }, false, 'sub/set');
  },

  /**
   * can('analytics') → boolean
   * Owners on expired plan fall back to free_trial feature set.
   */
  can: (feature) => {
    const { subscription } = get();
    if (subscription.status !== 'active') {
      return PLAN_LIMITS.free_trial.features[feature] === true;
    }
    return subscription.features?.[feature] === true;
  },

  /** Count this month's finalized invoices against free limit */
  monthlyInvoiceCount: () => {
    const now       = new Date();
    const monthStr  = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const invoices  = get().invoices || [];
    return invoices.filter(
      (i) => i.status === 'final' && (i.date || '').startsWith(monthStr)
    ).length;
  },

  canCreateInvoice: () => {
    const { subscription, monthlyInvoiceCount } = get();
    if (subscription.features?.unlimitedInvoices) return true;
    const limit = PLAN_LIMITS[subscription.tier]?.invoiceLimit || 30;
    return monthlyInvoiceCount() < limit;
  },
});
