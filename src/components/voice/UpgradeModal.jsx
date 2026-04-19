import { useState }        from 'react';
import { useAppStore }     from '@/store';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button }          from '@/components/ui/Button';
import { PLAN_LIMITS }     from '@/config/constants';

const PLANS = [
  {
    tier:     'pro',
    emoji:    '⚡',
    label:    'Pro',
    price:    '₹499 / month',
    color:    '#059669',
    features: ['Unlimited invoices', 'Advanced analytics', 'Up to 10 employees', 'Bulk PDF export', 'Recurring invoices', 'Priority email support'],
    badgeBg:  '#dcfce7',
    badgeColor: '#166534',
  },
  {
    tier:     'enterprise',
    emoji:    '👑',
    label:    'Enterprise',
    price:    '₹1,499 / month',
    color:    '#7c3aed',
    features: ['Everything in Pro', 'Unlimited employees', 'White-label invoices', 'Dedicated support', 'Custom integrations', 'SLA guarantee'],
    badgeBg:  '#ede9fe',
    badgeColor: '#5b21b6',
  },
];

export function UpgradeModal() {
  const open        = useAppStore((s) => s.upgradeModalOpen);
  const closeModal  = useAppStore((s) => s.closeUpgradeModal);
  const reason      = useAppStore((s) => s._upgradeReason);
  const [selected, setSelected] = useState('pro');

  function handleUpgrade() {
    closeModal();
    // TODO: integrate Razorpay / Stripe
    // const prices = { pro: 49900, enterprise: 149900 };
    // const options = { key:'rzp_live_YOUR_KEY', amount:prices[selected], ... };
    // new Razorpay(options).open();
    window.open('https://wa.me/917254991801?text=I+want+to+upgrade+to+' + selected, '_blank');
  }

  return (
    <Modal
      open={open}
      onClose={closeModal}
      title="Upgrade Your Plan"
      maxWidth="max-w-[460px]"
    >
      {/* Subtitle */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-purple-50 border border-purple-100 rounded-xl">
        <span className="text-2xl">⭐</span>
        <p className="text-sm text-purple-800 font-medium">{reason || 'Unlock premium features for your business.'}</p>
      </div>

      {/* Plan cards */}
      <div className="flex flex-col gap-3 mb-2">
        {PLANS.map((plan) => {
          const isSelected = selected === plan.tier;
          return (
            <button
              key={plan.tier}
              onClick={() => setSelected(plan.tier)}
              className="text-left w-full p-4 rounded-[14px] border-2 transition-all cursor-pointer bg-transparent font-[inherit]"
              style={{
                borderColor:  isSelected ? plan.color : '#e2e8f0',
                background:   isSelected ? (plan.tier === 'pro' ? '#f0fdf4' : '#faf5ff') : '#fff',
              }}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="font-black text-[15px] text-slate-900">{plan.emoji} {plan.label}</div>
                <div className="font-bold text-[14px]" style={{ color: plan.color }}>{plan.price}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {plan.features.map((f) => (
                  <span
                    key={f}
                    className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: plan.badgeBg, color: plan.badgeColor }}
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <ModalFooter>
        <div className="w-full flex flex-col gap-2">
          <Button variant="primary" className="w-full !py-3 !text-sm" onClick={handleUpgrade}>
            🚀 Upgrade to {PLANS.find((p) => p.tier === selected)?.label}
          </Button>
          <p className="text-center text-[10px] text-slate-400">
            7-day free trial · Cancel anytime · GST invoice provided
          </p>
        </div>
      </ModalFooter>
    </Modal>
  );
}
