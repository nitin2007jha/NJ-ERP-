import { useMemo }        from 'react';
import { useAppStore }    from '@/store';
import { rupee, formatINR } from '@/utils/gst';
import { today, currentMonth } from '@/utils/date';

function StatCard({ label, value, sub, color = '#059669', icon }) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-100 p-4 shadow-card hover:-translate-y-0.5 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[.06em]">{label}</div>
        <div className="text-lg">{icon}</div>
      </div>
      <div className="text-2xl font-black text-slate-900 mb-0.5">{value}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const invoices = useAppStore((s) => s.invoices);
  const expenses = useAppStore((s) => s.expenses);
  const clients  = useAppStore((s) => s.clients);
  const products = useAppStore((s) => s.products);

  const month = currentMonth();
  const todayStr = today();

  const stats = useMemo(() => {
    const thisMonth = invoices.filter(
      (i) => i.status === 'final' && (i.date || '').startsWith(month)
    );
    const revenue     = thisMonth.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const paid        = thisMonth.filter((i) => i.paymentStatus === 'paid').reduce((s, i) => s + (i.grandTotal || 0), 0);
    const outstanding = revenue - paid;
    const todayInv    = invoices.filter((i) => i.date === todayStr && i.status === 'final');
    const todaySales  = todayInv.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const monthExp    = expenses.filter((e) => !e.isDeleted && (e.date || '').startsWith(month)).reduce((s, e) => s + (e.amount || 0), 0);
    const lowStock    = products.filter((p) => !p.isDeleted && (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)).length;

    return { revenue, paid, outstanding, todayInv: todayInv.length, todaySales, monthExp, lowStock, totalClients: clients.filter((c) => !c.isDeleted).length, totalInv: thisMonth.length };
  }, [invoices, expenses, clients, products, month, todayStr]);

  return (
    <div className="erp-tab-enter">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-400 text-sm">Business overview for {month}</p>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard label="Monthly Revenue" value={rupee(stats.revenue)} sub={`${stats.totalInv} invoices`} icon="💰" />
        <StatCard label="Today's Sales"   value={rupee(stats.todaySales)} sub={`${stats.todayInv} bills today`} icon="📈" />
        <StatCard label="Outstanding"     value={rupee(stats.outstanding)} sub="Unpaid balance" icon="⏳" color="#f59e0b" />
        <StatCard label="Monthly Expense" value={rupee(stats.monthExp)} sub="Total spent" icon="💸" color="#ef4444" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Clients"    value={stats.totalClients} sub="Active" icon="👥" />
        <StatCard label="Low Stock"  value={stats.lowStock}     sub="Items to reorder" icon="📦" color={stats.lowStock > 0 ? '#ef4444' : '#059669'} />
        <StatCard label="Collected"  value={rupee(stats.paid)}  sub="This month" icon="✅" />
        <StatCard label="Net Profit" value={rupee(stats.revenue - stats.monthExp)} sub="Revenue − Expenses" icon="🏦" />
      </div>

      {/* Recent invoices */}
      <div className="bg-white rounded-[14px] border border-slate-100 shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h3 className="font-bold text-slate-800 text-sm">Recent Invoices</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Invoice #', 'Client', 'Date', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-[.06em] text-left bg-slate-50 border-b border-slate-100 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.filter((i) => i.status === 'final').slice(0, 8).map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-[13px] font-semibold text-brand-600">{inv.id}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-700">{inv.client?.name || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{inv.date || '—'}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">₹{formatINR(inv.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${inv.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {inv.paymentStatus || 'unpaid'}
                    </span>
                  </td>
                </tr>
              ))}
              {invoices.filter((i) => i.status === 'final').length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">No invoices yet. Create your first invoice!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
