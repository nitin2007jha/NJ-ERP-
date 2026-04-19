import { useState }       from 'react';
import { useAppStore }    from '@/store';
import { Button }         from '@/components/ui/Button';
import { Badge }          from '@/components/ui/Badge';
import { exportInvoicePDF } from '@/services/pdf/invoice.pdf';
import { exportBulkPDF }    from '@/services/pdf/bulk.pdf';
import { formatINR }      from '@/utils/gst';

export default function InvoiceRecords() {
  const invoices         = useAppStore((s) => s.invoices);
  const getFiltered      = useAppStore((s) => s.getFilteredInvoices);
  const setFilters       = useAppStore((s) => s.setFilters);
  const filters          = useAppStore((s) => s.filters);
  const settings         = useAppStore((s) => s.settings);
  const updateInvoice    = useAppStore((s) => s.updateInvoice);
  const addToast         = useAppStore((s) => s.addToast);
  const [bulkLoading, setBulkLoading] = useState(false);

  const finalInvoices = getFiltered().filter((i) => i.status === 'final');

  async function handleBulkPDF() {
    if (!finalInvoices.length) { addToast('No invoices to export', 'error'); return; }
    setBulkLoading(true);
    try {
      await exportBulkPDF(finalInvoices, settings, (cur, total) =>
        addToast(`Generating ${cur}/${total}...`)
      );
      addToast('Bulk PDF downloaded! ✅', 'success');
    } catch (e) {
      addToast('PDF error: ' + e.message, 'error');
    } finally {
      setBulkLoading(false);
    }
  }

  return (
    <div className="erp-tab-enter">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Invoice Records</h2>
          <p className="text-slate-400 text-sm">{finalInvoices.length} invoices found</p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleBulkPDF} loading={bulkLoading}>
          📄 Bulk PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          type="text" placeholder="Search ID or client..."
          value={filters.query}
          onChange={(e) => setFilters({ query: e.target.value })}
          className="h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-white flex-1 min-w-[160px]"
        />
        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ startDate: e.target.value })}
          className="h-9 px-3 border border-slate-200 rounded-[10px] text-[12px] outline-none focus:border-brand-500 bg-white" />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ endDate: e.target.value })}
          className="h-9 px-3 border border-slate-200 rounded-[10px] text-[12px] outline-none focus:border-brand-500 bg-white" />
        <select value={filters.paymentStatus} onChange={(e) => setFilters({ paymentStatus: e.target.value })}
          className="h-9 px-3 border border-slate-200 rounded-[10px] text-[12px] outline-none focus:border-brand-500 bg-white">
          <option value="">All Status</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
        </select>
        <Button variant="ghost" size="sm" onClick={() => setFilters({ query:'', startDate:'', endDate:'', paymentStatus:'' })}>
          Clear
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Invoice #', 'Client', 'Date', 'Amount', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-[.06em] text-left bg-slate-50 border-b border-slate-100 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {finalInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-[13px] font-bold text-brand-600">{inv.id}</td>
                  <td className="px-4 py-3 text-[13px] text-slate-700">{inv.client?.name || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{inv.date}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">₹{formatINR(inv.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={inv.paymentStatus === 'paid' ? 'green' : inv.paymentStatus === 'partial' ? 'amber' : 'amber'}>
                      {inv.paymentStatus || 'unpaid'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => exportInvoicePDF(inv, settings)}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border-none cursor-pointer transition-colors"
                      >PDF</button>
                      {inv.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => { updateInvoice(inv.id, { paymentStatus: 'paid' }); addToast('Marked as paid ✅', 'success'); }}
                          className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-none cursor-pointer transition-colors"
                        >Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {finalInvoices.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">No invoices found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
