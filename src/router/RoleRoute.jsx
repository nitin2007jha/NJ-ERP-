import { useAppStore }      from '@/store';
import { useSubscription }  from '@/hooks/useSubscription';

/**
 * Role-based access gate.
 *
 * Props:
 *   permission      {string}  - key in employee permissions object
 *   ownerOnly       {bool}    - only owners can access (employees blocked)
 *   requiresFeature {string}  - subscription feature key (e.g. 'analytics')
 *   children        {node}
 */
export function RoleRoute({ permission, ownerOnly, requiresFeature, children }) {
  const isEmployee   = useAppStore((s) => s.isEmployee);
  const hasPermission = useAppStore((s) => s.hasPermission);
  const { can, promptUpgrade } = useSubscription();

  // Owner-only route: block employees entirely
  if (ownerOnly && isEmployee) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <span className="text-4xl">🔒</span>
        <p className="font-semibold text-sm">This section is owner-only.</p>
      </div>
    );
  }

  // Permission check for employees
  if (isEmployee && permission && !hasPermission(permission)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <span className="text-4xl">🚫</span>
        <p className="font-semibold text-sm">You don't have permission to access this section.</p>
        <p className="text-xs text-slate-300">Contact your manager to request access.</p>
      </div>
    );
  }

  // Subscription feature gate
  if (requiresFeature && !can(requiresFeature)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-400">
        <span className="text-4xl">⭐</span>
        <p className="font-semibold text-sm">This feature requires a Pro plan.</p>
        <button
          onClick={() => promptUpgrade(`${requiresFeature} requires a Pro plan.`)}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-xl hover:bg-brand-700 transition-colors"
        >
          Upgrade to Pro
        </button>
      </div>
    );
  }

  return children;
}
