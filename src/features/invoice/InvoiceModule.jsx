import { useState, useCallback } from 'react';
import { useAppStore }    from '@/store';
import { useSubscription } from '@/hooks/useSubscription';
import { Button }         from '@/components/ui/Button';
import { saveInvoice }    from '@/services/firebase/invoice.service';
import { exportInvoicePDF } from '@/services/pdf/invoice.pdf';
import { getNextInvoiceId, prefixForDocType } from '@/utils/invoiceId';
import { calcGST, rupee, formatINR } from '@/utils/gst';
import { today }          from '@/utils/date';
import { DOC_TYPES, PAYMENT_MODES } from '@/config/constants';

function ClientRow({ draft, onChange }) {
  const clients    = useAppStore((s) => s.clients);
  const [show, setShow] = useState(false);
  const [q, setQ]  = useState('');

  const matches = clients.filter(
    (c) => !c.isDeleted && c.name.toLowerCase().includes(q.toLowerCase())
  ).slice(0, 6);

  return (
    <div className="card p-4 mb-3">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Bill To</div>
      <div className="relative mb-2">
        <input
          className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-colors"
          placeholder="Client name..."
          value={draft.client?.name || ''}
          onChange={(e) => { onChange({ client: { ...draft.client, name: e.target.value } }); setQ(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          onBlur={() => setTimeout(() => setShow(false), 150)}
        />
        {show && q.length > 0 && matches.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
            {matches.map((c) => (
              <button key={c.id} onMouseDown={() => { onChange({ client: { name: c.name, mobile: c.mobile || '', gstin: c.gstin || '', address: c.address || '' } }); setShow(false); }}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center gap-2 border-none bg-transparent cursor-pointer">
                <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{c.name[0]}</div>
                <div><div className="text-[13px] font-semibold text-slate-800">{c.name}</div><div className="text-[10px] text-slate-400">{c.mobile}</div></div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[['Mobile', 'mobile', 'tel'], ['GSTIN', 'gstin', 'text'], ['Address', 'address', 'text']].map(([label, key, type]) => (
          <input key={key} type={type} placeholder={label}
            className="h-9 px-3 border border-slate-200 rounded-[10px] text-[12px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-colors col-span-1 last:col-span-2"
            value={draft.client?.[key] || ''}
            onChange={(e) => onChange({ client: { ...draft.client, [key]: e.target.value } })}
          />
        ))}
      </div>
    </div>
  );
}

function ItemTable({ items, onAdd, onUpdate, onRemove, products, services }) {
  const allItems = [...products, ...services].filter((p) => !p.isDeleted);
  const [q, setQ]       = useState('');
  const [showDrop, setShowDrop] = useState(false);

  const matches = allItems.filter((p) => p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 6);

  function selectItem(p) {
    onAdd({ name: p.name, qty: 1, rate: p.rate || 0, gst: p.gst || 0, hsn: p.hsn || p.sac || '', total: p.rate || 0 });
    setQ(''); setShowDrop(false);
  }

  return (
    <div className="card p-4 mb-3">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Items / Services</div>

      {/* Item search */}
      <div className="relative mb-3">
        <input
          className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-colors"
          placeholder="Search & add item..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setShowDrop(true); }}
          onFocus={() => setShowDrop(true)}
          onBlur={() => setTimeout(() => setShowDrop(false), 150)}
        />
        {showDrop && q.length > 0 && matches.length > 0 && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
            {matches.map((p) => (
              <button key={p.id} onMouseDown={() => selectItem(p)}
                className="w-full text-left px-3 py-2.5 hover:bg-slate-50 flex items-center justify-between border-none bg-transparent cursor-pointer">
                <span className="text-[13px] font-semibold text-slate-800">{p.name}</span>
                <span className="text-[11px] text-slate-400">₹{p.rate} · {p.gst}% GST</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items table */}
      {items.length > 0 && (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[12px] min-w-[500px]">
            <thead>
              <tr>
                {['Item', 'Qty', 'Rate', 'GST%', 'Amount', ''].map((h) => (
                  <th key={h} className="text-left text-[10px] font-bold text-slate-400 uppercase pb-2 px-1">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => {
                const amt = (it.qty || 0) * (it.rate || 0);
                const tax = (amt * (it.gst || 0)) / 100;
                return (
                  <tr key={it._id || i} className="border-t border-slate-50">
                    <td className="py-1.5 px-1 font-semibold text-slate-800">{it.name}</td>
                    <td className="py-1.5 px-1">
                      <input type="number" min="1" value={it.qty}
                        onChange={(e) => onUpdate(i, { qty: +e.target.value, total: +e.target.value * (it.rate || 0) })}
                        className="w-14 h-7 px-2 border border-slate-200 rounded-lg text-center outline-none focus:border-brand-500" />
                    </td>
                    <td className="py-1.5 px-1">
                      <input type="number" min="0" value={it.rate}
                        onChange={(e) => onUpdate(i, { rate: +e.target.value, total: (it.qty || 1) * +e.target.value })}
                        className="w-20 h-7 px-2 border border-slate-200 rounded-lg text-right outline-none focus:border-brand-500" />
                    </td>
                    <td className="py-1.5 px-1 text-slate-500">{it.gst}%</td>
                    <td className="py-1.5 px-1 font-semibold text-slate-800 text-right">₹{formatINR(amt + tax)}</td>
                    <td className="py-1.5 px-1">
                      <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-600 border-none bg-transparent cursor-pointer text-base leading-none">×</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-6 text-slate-400 text-sm">Search and add items above</div>
      )}
    </div>
  );
}

export default function InvoiceModule() {
  const draft         = useAppStore((s) => s.draft);
  const patchDraft    = useAppStore((s) => s.patchDraft);
  const setDraftClient = useAppStore((s) => s.setDraftClient);
  const addDraftItem  = useAppStore((s) => s.addDraftItem);
  const updateDraftItem = useAppStore((s) => s.updateDraftItem);
  const removeDraftItem = useAppStore((s) => s.removeDraftItem);
  const getDraftTotals = useAppStore((s) => s.getDraftTotals);
  const resetDraft    = useAppStore((s) => s.resetDraft);
  const invoices      = useAppStore((s) => s.invoices);
  const products      = useAppStore((s) => s.products);
  const services      = useAppStore((s) => s.services);
  const user          = useAppStore((s) => s.user);
  const settings      = useAppStore((s) => s.settings);
  const addInvoice    = useAppStore((s) => s.addInvoice);
  const addToast      = useAppStore((s) => s.addToast);
  const { canCreateInvoice, promptUpgrade } = useSubscription();

  const [saving, setSaving] = useState(false);
  const totals = getDraftTotals();

  async function handleSave() {
    if (!draft.client?.name) { addToast('Please enter a client name', 'error'); return; }
    if (!draft.items.length)  { addToast('Please add at least one item', 'error'); return; }
    if (!canCreateInvoice()) { promptUpgrade('You have reached the free invoice limit (30/month). Upgrade to Pro for unlimited invoices.'); return; }

    setSaving(true);
    try {
      const prefix = prefixForDocType(draft.docType);
      const id     = draft.id || getNextInvoiceId(invoices, prefix);
      const inv    = { ...draft, ...totals, id, status: 'final', createdAt: Date.now() };
      if (user && !user.isDemo) await saveInvoice(user.uid, inv);
      addInvoice(inv);
      addToast(`Invoice ${id} saved! ✅`, 'success');
      resetDraft();
    } catch (e) {
      addToast('Save failed: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePDF() {
    if (!draft.client?.name || !draft.items.length) { addToast('Fill in client and items first', 'error'); return; }
    const prefix = prefixForDocType(draft.docType);
    const inv    = { ...draft, ...totals, id: draft.id || getNextInvoiceId(invoices, prefix) };
    await exportInvoicePDF(inv, settings);
  }

  return (
    <div className="erp-tab-enter max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">New Invoice</h2>
          <p className="text-slate-400 text-sm">{draft.id || 'Draft'}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={resetDraft}>Reset</Button>
          <Button variant="ghost" size="sm" onClick={handlePDF}>Preview PDF</Button>
          <Button size="sm" onClick={handleSave} loading={saving}>Save Invoice</Button>
        </div>
      </div>

      {/* Doc type + date row */}
      <div className="card p-4 mb-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Document Type</label>
            <select value={draft.docType} onChange={(e) => patchDraft({ docType: e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white">
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date</label>
            <input type="date" value={draft.date} onChange={(e) => patchDraft({ date: e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Mode</label>
            <select value={draft.paymentMode} onChange={(e) => patchDraft({ paymentMode: e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white">
              {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</label>
            <select value={draft.paymentStatus} onChange={(e) => patchDraft({ paymentStatus: e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white">
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
      </div>

      <ClientRow draft={draft} onChange={(patch) => patch.client ? setDraftClient(patch.client) : patchDraft(patch)} />

      <ItemTable items={draft.items} products={products} services={services}
        onAdd={addDraftItem} onUpdate={updateDraftItem} onRemove={removeDraftItem} />

      {/* Totals */}
      {draft.items.length > 0 && (
        <div className="card p-4 mb-4">
          <div className="ml-auto max-w-[260px] space-y-1.5">
            {[
              ['Subtotal',    rupee(totals.subtotal)],
              ['GST',         rupee(totals.totalTax)],
              totals.discount ? ['Discount', `-${rupee(totals.discount)}`] : null,
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[12px] text-slate-500">
                <span>{k}</span><span>{v}</span>
              </div>
            ))}
            <div className="flex justify-between text-[15px] font-black text-brand-600 border-t border-brand-200 pt-2 mt-1">
              <span>Grand Total</span><span>{rupee(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={resetDraft}>Clear</Button>
        <Button onClick={handleSave} loading={saving} className="px-6">💾 Save Invoice</Button>
      </div>
    </div>
  );
}
