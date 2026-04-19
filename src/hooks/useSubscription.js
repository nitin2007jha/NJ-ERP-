import { useAppStore } from '@/store';

/**
 * Convenience hook — exposes subscription state and feature gates.
 *
 * Usage:
 *   const { can, tier, promptUpgrade } = useSubscription();
 *   if (!can('analytics')) promptUpgrade('Analytics requires Pro plan.');
 */
export function useSubscription() {
  const subscription   = useAppStore((s) => s.subscription);
  const can            = useAppStore((s) => s.can);
  const canCreate      = useAppStore((s) => s.canCreateInvoice);
  const openUpgrade    = useAppStore((s) => s.openUpgradeModal);

  function promptUpgrade(reason) {
    // Store the reason so UpgradeModal can display it
    useAppStore.setState({ _upgradeReason: reason });
    openUpgrade();
  }

  return {
    subscription,
    tier:             subscription?.tier || 'free_trial',
    status:           subscription?.status || 'active',
    can,
    canCreateInvoice: canCreate,
    promptUpgrade,
  };
}
