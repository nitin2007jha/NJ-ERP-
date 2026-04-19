import { useState }         from 'react';
import { useAppStore }      from '@/store';
import { Button }           from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { saveService, deleteService } from '@/services/firebase/inventory.service';
import { GST_RATES }        from '@/config/constants';

const BLANK = { name:'', category:'', sac:'', rate:0, duration:30, gst:18, description:'' };
const CATS  = ['Consultation', 'Treatment', 'Therapy', 'Diagnostic', 'Surgery', 'Wellness', 'Other'];

export default function ServicesModule() {
  const services      = useAppStore((s) => s.services).filter((s) => !s.isDeleted);
  const addService    = useAppStore((s) => s.addService);
  const updateService = useAppStore((s) => s.updateService);
  const softDeleteSvc = useAppStore((s) => s.softDeleteService);
  const user          = useAppStore((s) => s.user);
  const addToast      = useAppStore((s) => s.addToast);

  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null);
  const [form,    setForm]    = useState(BLANK);
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(false);

  const filtered = services.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) ||
           (s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  function openAdd()   { setForm(BLANK); setEditing(null); setModal(true); }
  function openEdit(s) { setForm({ ...s }); setEditing(s.id); setModal(true); }

  async function handleSave() {
    if (!form.name.trim()) { addToast('Service name is required', 'error'); return; }
    setSaving(true);
    try {
      const id = await saveService(user?.uid, { ...form, id: editing || undefined });
      if (editing) updateService(editing, form);
      else addService({ ...form, id, isDeleted: false });
      addToast(editing ? 'Service updated ✅' : 'Service added ✅', 'success');
      setModal(false);
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await deleteService(user?.uid, id);
    softDeleteSvc(id);
    addToast('Service removed', 'info');
  }

  return (
    <div className="erp-tab-enter">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Services</h2>
          <p className="text-slate-400 text-sm">{services.length} services</p>
        </div>
        <Button size="sm" onClick={openAdd}>+ Add Service</Button>
      </div>

      <input type="text" placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-white mb-3" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((svc) => (
          <div key={svc.id} className="bg-white rounded-[14px] border border-slate-100 shadow-card p-4 hover:-translate-y-0.5 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-bold text-slate-800 text-[14px]">{svc.name}</div>
                <div className="text-[11px] text-slate-400">{svc.category}</div>
              </div>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                SAC {svc.sac || '9993'}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-black text-brand-600">₹{svc.rate}</div>
              <div className="text-[11px] text-slate-400">
                {svc.duration} min · GST {svc.gst}%
              </div>
            </div>
            <div className="flex gap-1.5">
              <button onClick={() => openEdit(svc)}
                className="flex-1 text-[11px] font-bold py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border-none cursor-pointer">Edit</button>
              <button onClick={() => handleDelete(svc.id)}
                className="px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border-none cursor-pointer text-[11px] font-bold">✕</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">No services yet. Add your first service!</div>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Service' : 'Add Service'}>
        <div className="grid grid-cols-2 gap-3">
          {[['Service Name *', 'name', 'text', 'col-span-2'], ['Category', 'category', 'text', ''],
            ['SAC Code', 'sac', 'text', ''], ['Rate (₹) *', 'rate', 'number', ''],
            ['Duration (min)', 'duration', 'number', ''],
            ['Description', 'description', 'text', 'col-span-2'],
          ].map(([label, key, type, span]) => (
            <div key={key} className={span || ''}>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
              {key === 'category' ? (
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white">
                  <option value="">Select...</option>
                  {CATS.map((c) => <option key={c}>{c}</option>)}
                </select>
              ) : (
                <input type={type} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: type === 'number' ? +e.target.value : e.target.value })}
                  className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
              )}
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
