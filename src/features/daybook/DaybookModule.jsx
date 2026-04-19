import { useMemo, useState } from 'react';
import { useAppStore }       from '@/store';
import { formatINR }         from '@/utils/gst';
import { today }             from '@/utils/date';

export default function DaybookModule() {
  const invoices = useAppStore((s) => s.invoices);
  const expenses = useAppStore((s) => s.expenses);
  const [date, setDate] = useState(today());

  const data = useMemo(() => {
    const dayInv  = invoices.filter((i) => i.date === date && i.status === 'final');
    const dayExp  = expenses.filter((e) => !e.isDeleted && e.date === date);

    // Group invoices by payment mode
    const cash    = dayInv.filter((i) => i.paymentMode === 'Cash');
    const digital = dayInv.filter((i) => i.paymentMode !== 'Cash');
    const credit  = dayInv.filter((i) => i.paymentStatus !== 'paid');

    const cashTotal    = cash.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const digitalTotal = digital.filter((i) => i.paymentStatus === 'paid').reduce((s, i) => s + (i.grandTotal || 0), 0);
    const creditTotal  = credit.reduce((s, i) => s + (i.grandTotal || 0), 0);
    const expTotal     = dayExp.reduce((s, e) => s + (e.amount || 0), 0);
    const netCash      = cashTotal - dayExp.filter((e) => e.paymentMode === 'Cash').reduce((s, e) => s + (e.amount || 0), 0);

    return { dayInv, dayExp, cash, digital, credit, cashTotal, digitalTotal, creditTotal, expTotal, netCash };
  }, [invoices, expenses, date]);

  return (
    <div className="erp-tab-enter">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daybook</h2>
          <p className="text-slate-400 text-sm">Daily cash & collections register</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-white" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          ['Cash Collected',    `₹${formatINR(data.cashTotal)}`,    '💵', '#10b981'],
          ['Digital / UPI',     `₹${formatINR(data.digitalTotal)}`, '📱', '#3b82f6'],
          ['Credit / Pending',  `₹${formatINR(data.creditTotal)}`,  '⏳', '#f59e0b'],
          ['Net Cash in Hand',  `₹${formatINR(data.netCash)}`,      '🏦', '#059669'],
        ].map(([label, value, icon, color]) => (
          <div key={label} className="bg-white rounded-[14px] border border-slate-100 shadow-card p-4">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-xl font-black" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Invoices of the day */}
        <div className="bg-white rounded-[14px] border border-slate-100 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 font-bold text-slate-700 text-sm">
            📄 Invoices ({data.dayInv.length})
          </div>
          <div className="overflow-y-auto max-h-80">
            {data.dayInv.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">No invoices for this date</div>
            ) : data.dayInv.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-[13px] font-semibold text-brand-600">{inv.id}</div>
                  <div className="text-[11px] text-slate-400">{inv.client?.name} · {inv.paymentMode}</div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold text-slate-800">₹{formatINR(inv.grandTotal)}</div>
                  <div className={`text-[10px] font-bold ${inv.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {inv.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses of the day */}
        <div className="bg-white rounded-[14px] border border-slate-100 shadow-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50 font-bold text-slate-700 text-sm">
            💸 Expenses ({data.dayExp.length}) · ₹{formatINR(data.expTotal)}
          </div>
          <div className="overflow-y-auto max-h-80">
            {data.dayExp.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">No expenses for this date</div>
            ) : data.dayExp.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="text-[13px] font-semibold text-slate-700">{exp.description}</div>
                  <div className="text-[11px] text-slate-400">{exp.category} · {exp.paymentMode}</div>
                </div>
                <div className="text-[13px] font-bold text-red-500">-₹{formatINR(exp.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
            }
