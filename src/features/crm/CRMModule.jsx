import { useState }         from 'react';
import { useAppStore }      from '@/store';
import { Button }           from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { saveClient }       from '@/services/firebase/crm.service';
import { formatINR }        from '@/utils/gst';

const BLANK = { name:'', mobile:'', email:'', gstin:'', address:'', city:'', notes:'' };

export default function CRMModule() {
  const clients      = useAppStore((s) => s.clients).filter((c) => !c.isDeleted);
  const invoices     = useAppStore((s) => s.invoices);
  const addClient    = useAppStore((s) => s.addClient);
  const updateClient = useAppStore((s) => s.updateClient);
  const user         = useAppStore((s) => s.user);
  const addToast     = useAppStore((s) => s.addToast);

  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);

  const filtered = clients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) ||
           (c.mobile || '').includes(search)
  );

  function getBalance(clientName) {
    return invoices.filter((i) => i.client?.name === clientName && i.paymentStatus !== 'paid' && i.status === 'final')
      .reduce((s, i) => s + (i.grandTotal || 0), 0);
  }

  function getInvoiceCount(clientName) {
    return invoices.filter((i) => i.client?.name === clientName && i.status === 'final').length;
  }

  function openAdd()   { setForm(BLANK); setEditing(null); setModal(true); }
  function openEdit(c) { setForm({ ...c }); setEditing(c.id); setModal(true); }

  async function handleSave() {
    if (!form.name.trim()) { addToast('Client name is required', 'error'); return; }
    setSaving(true);
    try {
      const id = await saveClient(user?.uid, { ...form, id: editing || undefined });
      if (editing) updateClient(editing, form);
      else addClient({ ...form, id, journal: [], isDeleted: false });
      addToast(editing ? 'Client updated ✅' : 'Client added ✅', 'success');
      setModal(false);
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="erp-tab-enter">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Clients / CRM</h2>
          <p className="text-slate-400 text-sm">{clients.length} clients</p>
        </div>
        <Button size="sm" onClick={openAdd}>+ Add Client</Button>
      </div>

      <input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-white mb-3" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((c) => {
          const bal = getBalance(c.name);
          const cnt = getInvoiceCount(c.name);
          return (
            <div key={c.id} className="bg-white rounded-[14px] border border-slate-100 shadow-card p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {c.name[0]?.toUpperCase()}
                </div>
                <button onClick={() => openEdit(c)} className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border-none cursor-pointer">Edit</button>
              </div>
              <div className="font-bold text-slate-800 text-[14px] mb-0.5">{c.name}</div>
              <div className="text-[12px] text-slate-400 mb-2">{c.mobile || 'No phone'}</div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">{cnt} invoices</span>
                {bal > 0 ? (
                  <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">₹{formatINR(bal)} due</span>
                ) : (
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Cleared</span>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">No clients found</div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Client' : 'Add Client'}>
        <div className="grid grid-cols-2 gap-3">
          {[['Full Name *', 'name', 'text', 'col-span-2'], ['Mobile', 'mobile', 'tel', ''],
            ['Email', 'email', 'email', ''], ['GSTIN', 'gstin', 'text', ''],
            ['Address', 'address', 'text', 'col-span-2'], ['City', 'city', 'text', ''],
            ['Notes', 'notes', 'text', 'col-span-2']
          ].map(([label, key, type, extra]) => (
            <div key={key} className={extra || ''}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
              <input type={type} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
            </div>
          ))}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
