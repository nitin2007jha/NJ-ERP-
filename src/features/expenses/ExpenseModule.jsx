import { useState }         from 'react';
import { useAppStore }      from '@/store';
import { Button }           from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { saveExpense, deleteExpense } from '@/services/firebase/expense.service';
import { formatINR }        from '@/utils/gst';
import { today, currentMonth } from '@/utils/date';
import { EXPENSE_CATEGORIES, PAYMENT_MODES } from '@/config/constants';

const BLANK = { date: today(), category: 'Rent', description: '', amount: 0, paymentMode: 'Cash', notes: '' };

export default function ExpenseModule() {
  const expenses       = useAppStore((s) => s.expenses).filter((e) => !e.isDeleted);
  const addExpense     = useAppStore((s) => s.addExpense);
  const softDeleteExp  = useAppStore((s) => s.softDeleteExpense);
  const user           = useAppStore((s) => s.user);
  const addToast       = useAppStore((s) => s.addToast);

  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(BLANK);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const month    = currentMonth();
  const filtered = expenses.filter(
    (e) => (e.description || '').toLowerCase().includes(search.toLowerCase()) ||
           (e.category || '').toLowerCase().includes(search.toLowerCase())
  );
  const totalMonth = expenses
    .filter((e) => (e.date || '').startsWith(month))
    .reduce((s, e) => s + (e.amount || 0), 0);

  async function handleSave() {
    if (!form.description.trim()) { addToast('Description is required', 'error'); return; }
    if (!form.amount || form.amount <= 0) { addToast('Enter a valid amount', 'error'); return; }
    setSaving(true);
    try {
      const id = await saveExpense(user?.uid, form);
      addExpense({ ...form, id, isDeleted: false });
      addToast('Expense added ✅', 'success');
      setModal(false);
      setForm(BLANK);
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this expense?')) return;
    await deleteExpense(user?.uid, id);
    softDeleteExp(id);
    addToast('Expense deleted', 'info');
  }

  return (
    <div className="erp-tab-enter">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Expenses</h2>
          <p className="text-slate-400 text-sm">This month: ₹{formatINR(totalMonth)}</p>
        </div>
        <Button size="sm" onClick={() => { setForm(BLANK); setModal(true); }}>+ Add Expense</Button>
      </div>

      <input type="text" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-white mb-3" />

      <div className="bg-white rounded-[14px] border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Date', 'Category', 'Description', 'Amount', 'Mode', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-[.06em] text-left bg-slate-50 border-b border-slate-100 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 text-[12px] text-slate-400">{e.date}</td>
                  <td className="px-4 py-3"><span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">{e.category}</span></td>
                  <td className="px-4 py-3 text-[13px] text-slate-700">{e.description}</td>
                  <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">₹{formatINR(e.amount)}</td>
                  <td className="px-4 py-3 text-[12px] text-slate-400">{e.paymentMode}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(e.id)} className="text-red-400 hover:text-red-600 border-none bg-transparent cursor-pointer text-sm font-bold">Delete</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400 text-sm">No expenses found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Expense">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white">
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Description *</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Amount (₹) *</label>
            <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: +e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Payment Mode</label>
            <select value={form.paymentMode} onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
              className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white">
              {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
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
