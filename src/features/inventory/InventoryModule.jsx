import { useState }         from 'react';
import { useAppStore }      from '@/store';
import { Button }           from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Badge }            from '@/components/ui/Badge';
import { saveProduct }      from '@/services/firebase/inventory.service';
import { today }            from '@/utils/date';
import { GST_RATES }        from '@/config/constants';

const BLANK = { name:'', category:'', hsn:'', rate:0, cost:0, gst:18, stock:0, lowStockThreshold:5, unit:'pcs' };

export default function InventoryModule() {
  const products     = useAppStore((s) => s.products).filter((p) => !p.isDeleted);
  const addProduct   = useAppStore((s) => s.addProduct);
  const updateProduct = useAppStore((s) => s.updateProduct);
  const user         = useAppStore((s) => s.user);
  const addToast     = useAppStore((s) => s.addToast);

  const [modal, setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]     = useState(BLANK);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = products.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase()) ||
           (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  function openAdd()  { setForm(BLANK); setEditing(null); setModal(true); }
  function openEdit(p){ setForm({ ...p }); setEditing(p.id); setModal(true); }

  async function handleSave() {
    if (!form.name.trim()) { addToast('Product name is required', 'error'); return; }
    setSaving(true);
    try {
      const uid = user?.uid;
      const id  = await saveProduct(uid, { ...form, id: editing || undefined });
      if (editing) updateProduct(editing, form);
      else addProduct({ ...form, id });
      addToast(editing ? 'Product updated ✅' : 'Product added ✅', 'success');
      setModal(false);
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const lowCount = products.filter((p) => (p.stock ?? 0) <= (p.lowStockThreshold ?? 5)).length;

  return (
    <div className="erp-tab-enter">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Inventory</h2>
          <p className="text-slate-400 text-sm">{products.length} products{lowCount > 0 ? ` · ${lowCount} low stock ⚠️` : ''}</p>
        </div>
        <Button size="sm" onClick={openAdd}>+ Add Product</Button>
      </div>

      <div className="mb-3">
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-white" />
      </div>

      <div className="bg-white rounded-[14px] border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Product', 'Category', 'HSN', 'Rate', 'Cost', 'GST', 'Stock', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-[.06em] text-left bg-slate-50 border-b border-slate-100 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">{p.name}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400 font-mono">{p.hsn || '—'}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">₹{p.rate}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">₹{p.cost || 0}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-500">{p.gst}%</td>
                  <td className="px-4 py-3">
                    <Badge variant={(p.stock ?? 0) <= (p.lowStockThreshold ?? 5) ? 'red' : 'green'}>
                      {p.stock ?? 0} {p.unit || 'pcs'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(p)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border-none cursor-pointer">Edit</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Product' : 'Add Product'}>
        <div className="grid grid-cols-2 gap-3">
          {[['Product Name *', 'name', 'text', 'col-span-2'], ['Category', 'category', 'text', ''], ['HSN Code', 'hsn', 'text', ''],
            ['Sale Rate (₹)', 'rate', 'number', ''], ['Cost Price (₹)', 'cost', 'number', ''],
            ['Opening Stock', 'stock', 'number', ''], ['Low Stock Alert', 'lowStockThreshold', 'number', ''], ['Unit', 'unit', 'text', '']
          ].map(([label, key, type, extra]) => (
            <div key={key} className={extra || ''}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
              <input type={type} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: type === 'number' ? +e.target.value : e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
            </div>
          ))}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">GST Rate</label>
            <select value={form.gst} onChange={(e) => setForm({ ...form, gst: +e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white">
              {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
            </select>
          </div>
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
