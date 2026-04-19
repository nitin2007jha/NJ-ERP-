import { useMemo }        from 'react';
import { useAppStore }    from '@/store';
import { formatINR }      from '@/utils/gst';
import { monthStart, monthEnd } from '@/utils/date';

/* ── Tiny bar chart (CSS only, no Chart.js dep needed for basic view) ────── */
function MiniBar({ label, value, max, color = '#059669' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <div className="text-[11px] text-slate-500 w-24 flex-shrink-0 truncate">{label}</div>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="text-[11px] font-bold text-slate-700 w-16 text-right flex-shrink-0">₹{formatINR(value)}</div>
    </div>
  );
}

function KPICard({ label, value, sub, trend, icon }) {
  const up = trend > 0;
  return (
    <div className="bg-white rounded-[14px] border border-slate-100 shadow-card p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</div>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
      {trend !== undefined && (
        <div className={`text-[11px] font-bold mt-1 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}% vs last month
        </div>
      )}
    </div>
  );
}

export default function Analytics() {
  const invoices = useAppStore((s) => s.invoices);
  const expenses = useAppStore((s) => s.expenses);
  const clients  = useAppStore((s) => s.clients);

  const stats = useMemo(() => {
    const now      = new Date();
    const thisM    = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const lastM    = (() => {
      const d = new Date(now); d.setMonth(d.getMonth() - 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    const final   = invoices.filter((i) => i.status === 'final');
    const thisInv = final.filter((i) => (i.date || '').startsWith(thisM));
    const lastInv = final.filter((i) => (i.date || '').startsWith(lastM));

    const thisRev  = thisInv.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const lastRev  = lastInv.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const revTrend = lastRev > 0 ? ((thisRev - lastRev) / lastRev) * 100 : 0;

    const thisExp  = expenses.filter((e) => !e.isDeleted && (e.date || '').startsWith(thisM))
                              .reduce((s, e) => s + (e.amount || 0), 0);
    const profit   = thisRev - thisExp;

    // Top clients by revenue
    const clientRev = {};
    final.forEach((inv) => {
      const n = inv.client?.name || 'Unknown';
      clientRev[n] = (clientRev[n] || 0) + (inv.grandTotal || 0);
    });
    const topClients = Object.entries(clientRev).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxClientRev = topClients[0]?.[1] || 1;

    // Monthly revenue — last 6 months
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now); d.setMonth(d.getMonth() - i);
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rev = final.filter((inv) => (inv.date || '').startsWith(m)).reduce((s, inv) => s + (inv.grandTotal || 0), 0);
      monthly.push({ month: d.toLocaleString('default', { month: 'short' }), rev });
    }
    const maxMonthly = Math.max(...monthly.map((m) => m.rev), 1);

    // Payment mode breakdown
    const byMode = {};
    thisInv.forEach((inv) => {
      const m = inv.paymentMode || 'Other';
      byMode[m] = (byMode[m] || 0) + (inv.grandTotal || 0);
    });

    // Collection efficiency
    const totalDue  = final.filter((i) => i.paymentStatus !== 'paid').reduce((s, i) => s + (i.grandTotal || 0), 0);
    const collected = final.filter((i) => i.paymentStatus === 'paid').reduce((s, i) => s + (i.grandTotal || 0), 0);
    const efficiency = (collected + totalDue) > 0
      ? Math.round((collected / (collected + totalDue)) * 100)
      : 100;

    return { thisRev, lastRev, revTrend, thisExp, profit, thisInv: thisInv.length, lastInv: lastInv.length, topClients, maxClientRev, monthly, maxMonthly, byMode, totalDue, efficiency };
  }, [invoices, expenses]);

  return (
    <div className="erp-tab-enter">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-slate-800">Analytics</h2>
        <p className="text-slate-400 text-sm">Business performance overview</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPICard label="This Month Revenue" value={`₹${formatINR(stats.thisRev)}`}       sub={`${stats.thisInv} invoices`}       trend={stats.revTrend} icon="💰" />
        <KPICard label="Net Profit"          value={`₹${formatINR(stats.profit)}`}        sub={`After ₹${formatINR(stats.thisExp)} expenses`}            icon="📈" />
        <KPICard label="Outstanding"         value={`₹${formatINR(stats.totalDue)}`}      sub="Unpaid receivables"                                        icon="⏳" />
        <KPICard label="Collection Rate"     value={`${stats.efficiency}%`}               sub="Paid vs total billed"                                      icon="✅" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Monthly revenue trend */}
        <div className="bg-white rounded-[14px] border border-slate-100 shadow-card p-5">
          <div className="font-bold text-slate-800 text-sm mb-4">Monthly Revenue (6 months)</div>
          <div className="flex items-end gap-2 h-32">
            {stats.monthly.map(({ month, rev }) => {
              const pct = Math.round((rev / stats.maxMonthly) * 100);
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] font-bold text-slate-500">₹{formatINR(rev / 1000)}k</div>
                  <div className="w-full rounded-t-md transition-all" style={{ height: `${Math.max(pct, 4)}%`, background: 'linear-gradient(to top,#059669,#34d399)' }} />
                  <div className="text-[9px] text-slate-400 font-semibold">{month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-[14px] border border-slate-100 shadow-card p-5">
          <div className="font-bold text-slate-800 text-sm mb-4">Top Clients by Revenue</div>
          {stats.topClients.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">No data yet</div>
          ) : stats.topClients.map(([name, rev]) => (
            <MiniBar key={name} label={name} value={rev} max={stats.maxClientRev} color="#059669" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment mode breakdown */}
        <div className="bg-white rounded-[14px] border border-slate-100 shadow-card p-5">
          <div className="font-bold text-slate-800 text-sm mb-4">Payment Mode Split (This Month)</div>
          {Object.keys(stats.byMode).length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">No payments this month</div>
          ) : (() => {
            const total = Object.values(stats.byMode).reduce((s, v) => s + v, 0);
            const colors = { UPI:'#3b82f6', Cash:'#10b981', Card:'#8b5cf6', 'Bank Transfer':'#f59e0b', Cheque:'#ef4444' };
            return Object.entries(stats.byMode).map(([mode, amt]) => (
              <MiniBar key={mode} label={mode} value={amt} max={total} color={colors[mode] || '#64748b'} />
            ));
          })()}
        </div>

        {/* Expense categories */}
        <div className="bg-white rounded-[14px] border border-slate-100 shadow-card p-5">
          <div className="font-bold text-slate-800 text-sm mb-4">Expense Breakdown (This Month)</div>
          {(() => {
            const now = new Date();
            const thisM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const byCat = {};
            expenses.filter((e) => !e.isDeleted && (e.date || '').startsWith(thisM))
              .forEach((e) => { byCat[e.category || 'Other'] = (byCat[e.category || 'Other'] || 0) + (e.amount || 0); });
            const maxExp = Math.max(...Object.values(byCat), 1);
            return Object.keys(byCat).length === 0
              ? <div className="text-slate-400 text-sm text-center py-8">No expenses this month</div>
              : Object.entries(byCat).map(([cat, amt]) => (
                  <MiniBar key={cat} label={cat} value={amt} max={maxExp} color="#ef4444" />
                ));
          })()}
        </div>
      </div>
    </div>
  );
                               }
