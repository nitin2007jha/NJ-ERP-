import { useState, useMemo }  from 'react';
import { useAppStore }        from '@/store';
import { formatINR }          from '@/utils/gst';
import { currentMonth, monthStart, monthEnd } from '@/utils/date';

const TABS = ['GSTR-1', 'GSTR-3B', 'HSN Summary'];

/* ── helpers ─────────────────────────────────────────────────────────────── */
function groupByRate(items) {
  return items.reduce((acc, it) => {
    const r = it.gst || 0;
    if (!acc[r]) acc[r] = { taxableAmt: 0, cgst: 0, sgst: 0, igst: 0 };
    const amt  = (it.qty || 0) * (it.rate || 0);
    const tax  = (amt * r) / 100;
    acc[r].taxableAmt += amt;
    acc[r].cgst       += tax / 2;
    acc[r].sgst       += tax / 2;
    return acc;
  }, {});
}

function groupByHSN(items) {
  return items.reduce((acc, it) => {
    const hsn = it.hsn || 'N/A';
    if (!acc[hsn]) acc[hsn] = { hsn, desc: it.name, qty: 0, taxable: 0, cgst: 0, sgst: 0, total: 0 };
    const amt = (it.qty || 0) * (it.rate || 0);
    const tax = (amt * (it.gst || 0)) / 100;
    acc[hsn].qty     += it.qty || 0;
    acc[hsn].taxable += amt;
    acc[hsn].cgst    += tax / 2;
    acc[hsn].sgst    += tax / 2;
    acc[hsn].total   += amt + tax;
    return acc;
  }, {});
}

/* ── sub-components ──────────────────────────────────────────────────────── */
function TableWrap({ headers, rows, emptyMsg }) {
  return (
    <div className="bg-white rounded-[14px] border border-slate-100 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[540px]">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-[.06em] text-left bg-slate-50 border-b border-slate-100 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={headers.length} className="px-4 py-10 text-center text-slate-400 text-sm">{emptyMsg}</td></tr>
            ) : rows.map((r, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                {r.map((cell, j) => (
                  <td key={j} className="px-4 py-3 text-[12px] text-slate-700 whitespace-nowrap">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── GSTR-1 ──────────────────────────────────────────────────────────────── */
function GSTR1({ invoices }) {
  const b2b = invoices.filter((i) => i.client?.gstin);
  const b2c = invoices.filter((i) => !i.client?.gstin);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-slate-700 text-sm mb-2">B2B Transactions (with GSTIN)</h3>
        <TableWrap
          headers={['Invoice #', 'Date', 'Client', 'GSTIN', 'Taxable', 'CGST', 'SGST', 'Total']}
          emptyMsg="No B2B invoices this month"
          rows={b2b.map((inv) => {
            const items   = inv.items || [];
            const taxable = items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0);
            const tax     = (inv.totalTax || 0);
            return [
              <span className="font-semibold text-brand-600">{inv.id}</span>,
              inv.date,
              inv.client?.name,
              <span className="font-mono text-[11px]">{inv.client?.gstin}</span>,
              `₹${formatINR(taxable)}`,
              `₹${formatINR(tax / 2)}`,
              `₹${formatINR(tax / 2)}`,
              <span className="font-bold">₹{formatINR(inv.grandTotal)}</span>,
            ];
          })}
        />
      </div>
      <div>
        <h3 className="font-bold text-slate-700 text-sm mb-2">B2C Transactions (without GSTIN)</h3>
        <TableWrap
          headers={['Invoice #', 'Date', 'Client', 'Taxable', 'CGST', 'SGST', 'Total']}
          emptyMsg="No B2C invoices this month"
          rows={b2c.map((inv) => {
            const taxable = (inv.subtotal || 0);
            const tax     = (inv.totalTax || 0);
            return [
              <span className="font-semibold text-brand-600">{inv.id}</span>,
              inv.date,
              inv.client?.name,
              `₹${formatINR(taxable)}`,
              `₹${formatINR(tax / 2)}`,
              `₹${formatINR(tax / 2)}`,
              <span className="font-bold">₹{formatINR(inv.grandTotal)}</span>,
            ];
          })}
        />
      </div>
    </div>
  );
}

/* ── GSTR-3B ─────────────────────────────────────────────────────────────── */
function GSTR3B({ invoices }) {
  const allItems = invoices.flatMap((i) => i.items || []);
  const byRate   = groupByRate(allItems);
  const rates    = Object.keys(byRate).sort((a, b) => +a - +b);

  const totals = rates.reduce((s, r) => ({
    taxable: s.taxable + byRate[r].taxableAmt,
    cgst:    s.cgst    + byRate[r].cgst,
    sgst:    s.sgst    + byRate[r].sgst,
  }), { taxable: 0, cgst: 0, sgst: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Total Taxable', `₹${formatINR(totals.taxable)}`, '💰'],
          ['Total CGST',    `₹${formatINR(totals.cgst)}`,    '📊'],
          ['Total SGST',    `₹${formatINR(totals.sgst)}`,    '📊'],
        ].map(([label, value, icon]) => (
          <div key={label} className="bg-white rounded-[14px] border border-slate-100 shadow-card p-4">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-xl font-black text-slate-800">{value}</div>
          </div>
        ))}
      </div>

      <TableWrap
        headers={['GST Rate', 'Taxable Amount', 'CGST', 'SGST', 'Total Tax']}
        emptyMsg="No taxable transactions this month"
        rows={rates.map((r) => {
          const d = byRate[r];
          return [
            <span className="font-bold text-brand-600">{r}%</span>,
            `₹${formatINR(d.taxableAmt)}`,
            `₹${formatINR(d.cgst)}`,
            `₹${formatINR(d.sgst)}`,
            <span className="font-bold">₹${formatINR(d.cgst + d.sgst)}</span>,
          ];
        })}
      />
    </div>
  );
}

/* ── HSN Summary ─────────────────────────────────────────────────────────── */
function HSNSummary({ invoices }) {
  const allItems = invoices.flatMap((i) => i.items || []);
  const byHSN    = groupByHSN(allItems);
  const rows     = Object.values(byHSN).sort((a, b) => b.total - a.total);

  return (
    <TableWrap
      headers={['HSN/SAC', 'Description', 'Qty', 'Taxable Value', 'CGST', 'SGST', 'Total']}
      emptyMsg="No HSN data this month"
      rows={rows.map((r) => [
        <span className="font-mono font-bold">{r.hsn}</span>,
        r.desc,
        r.qty,
        `₹${formatINR(r.taxable)}`,
        `₹${formatINR(r.cgst)}`,
        `₹${formatINR(r.sgst)}`,
        <span className="font-bold">₹${formatINR(r.total)}</span>,
      ])}
    />
  );
}

/* ── Main module ─────────────────────────────────────────────────────────── */
export default function GSTModule() {
  const invoices = useAppStore((s) => s.invoices);
  const [activeTab, setActiveTab] = useState(0);

  // Date range — default to current month
  const [start, setStart] = useState(monthStart());
  const [end,   setEnd]   = useState(monthEnd());

  const filtered = useMemo(() =>
    invoices.filter(
      (i) => i.status === 'final' &&
             (i.date || '') >= start &&
             (i.date || '') <= end
    ),
    [invoices, start, end]
  );

  const totalTax     = filtered.reduce((s, i) => s + (i.totalTax   || 0), 0);
  const totalTaxable = filtered.reduce((s, i) => s + (i.subtotal   || 0), 0);

  return (
    <div className="erp-tab-enter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">GST Module</h2>
          <p className="text-slate-400 text-sm">{filtered.length} invoices · Tax: ₹{formatINR(totalTax)}</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-[10px] text-[12px] outline-none focus:border-brand-500 bg-white" />
          <span className="text-slate-400 text-sm">to</span>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
            className="h-9 px-3 border border-slate-200 rounded-[10px] text-[12px] outline-none focus:border-brand-500 bg-white" />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          ['Invoices',         filtered.length,                   '🧾'],
          ['Total Sales',      `₹${formatINR(filtered.reduce((s,i)=>s+(i.grandTotal||0),0))}`, '💰'],
          ['Taxable Value',    `₹${formatINR(totalTaxable)}`,     '📋'],
          ['Total GST Payable',`₹${formatINR(totalTax)}`,         '🏦'],
        ].map(([label, value, icon]) => (
          <div key={label} className="bg-white rounded-[14px] border border-slate-100 shadow-card p-4">
            <div className="text-lg mb-1">{icon}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-lg font-black text-slate-800">{value}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4 w-fit">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={[
              'px-4 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer',
              i === activeTab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'bg-transparent text-slate-500 hover:text-slate-700',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 0 && <GSTR1 invoices={filtered} />}
      {activeTab === 1 && <GSTR3B invoices={filtered} />}
      {activeTab === 2 && <HSNSummary invoices={filtered} />}
    </div>
  );
}
