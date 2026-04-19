import { useState, useMemo }   from 'react';
import { useAppStore }         from '@/store';
import { Button }              from '@/components/ui/Button';
import { Modal, ModalFooter }  from '@/components/ui/Modal';
import { Badge }               from '@/components/ui/Badge';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db }                  from '@/config/firebase';
import { COL }                 from '@/config/constants';

/* ── Permission definitions ─────────────────────────────────────────────── */
const ALL_PERMISSIONS = {
  'Invoicing':    ['canCreateInvoice', 'canEditInvoice', 'canDeleteInvoice', 'canViewInvoices'],
  'Inventory':    ['canViewInventory', 'canEditInventory', 'canAddProduct'],
  'Clients':      ['canViewClients', 'canEditClients', 'canAddClient'],
  'Expenses':     ['canViewExpenses', 'canAddExpense', 'canDeleteExpense'],
  'Reports':      ['canViewAnalytics', 'canViewGST', 'canExportData'],
  'Employees':    ['canViewEmployees'],
};

const ROLE_TEMPLATES = {
  'Billing Staff':   ['canCreateInvoice', 'canViewInvoices', 'canViewClients', 'canViewInventory'],
  'Receptionist':    ['canCreateInvoice', 'canViewInvoices', 'canViewClients', 'canAddClient'],
  'Store Manager':   ['canViewInventory', 'canEditInventory', 'canAddProduct', 'canViewInvoices'],
  'Accountant':      ['canViewInvoices', 'canViewExpenses', 'canAddExpense', 'canViewAnalytics', 'canViewGST'],
  'Admin':           Object.values(ALL_PERMISSIONS).flat(),
};

const DEPTS = ['Billing', 'Pharmacy', 'Reception', 'Management', 'Accounts', 'Warehouse'];

const BLANK_EMP = {
  name: '', department: 'Billing', email: '', phone: '',
  role: '', active: true, permissions: {},
};

/* ── Permission toggle matrix ────────────────────────────────────────────── */
function PermMatrix({ permissions, onChange }) {
  return (
    <div className="space-y-3">
      {Object.entries(ALL_PERMISSIONS).map(([section, perms]) => (
        <div key={section}>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{section}</div>
          <div className="flex flex-wrap gap-2">
            {perms.map((p) => {
              const on = !!permissions[p];
              return (
                <button
                  key={p}
                  onClick={() => onChange({ ...permissions, [p]: !on })}
                  className={[
                    'text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer',
                    on
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-brand-300',
                  ].join(' ')}
                >
                  {on ? '✓ ' : ''}{p.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Main module ─────────────────────────────────────────────────────────── */
export default function EmployeeModule() {
  const user      = useAppStore((s) => s.user);
  const addToast  = useAppStore((s) => s.addToast);

  // Local employee state (persisted to Firestore)
  const [employees, setEmployees] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`erp_employees_${user?.uid}`) || '[]'); }
    catch { return []; }
  });

  const [modal,    setModal]   = useState(false);
  const [tab,      setTab]     = useState('info');   // 'info' | 'login' | 'permissions'
  const [editing,  setEditing] = useState(null);
  const [form,     setForm]    = useState(BLANK_EMP);
  const [password, setPassword] = useState('');
  const [saving,   setSaving]  = useState(false);
  const [search,   setSearch]  = useState('');

  const filtered = employees.filter(
    (e) => e.name.toLowerCase().includes(search.toLowerCase()) ||
           (e.department || '').toLowerCase().includes(search.toLowerCase())
  );

  function persist(list) {
    setEmployees(list);
    localStorage.setItem(`erp_employees_${user?.uid}`, JSON.stringify(list));
  }

  function openAdd() {
    setForm(BLANK_EMP); setPassword(''); setEditing(null); setTab('info'); setModal(true);
  }
  function openEdit(emp) {
    setForm({ ...emp }); setPassword(''); setEditing(emp.id); setTab('info'); setModal(true);
  }

  function applyTemplate(template) {
    const perms = {};
    (ROLE_TEMPLATES[template] || []).forEach((p) => { perms[p] = true; });
    setForm((f) => ({ ...f, role: template, permissions: perms }));
  }

  async function handleSave() {
    if (!form.name.trim())  { addToast('Name is required', 'error'); return; }
    if (!form.email.trim()) { addToast('Email is required', 'error'); return; }
    setSaving(true);
    try {
      const id  = editing || `emp_${Date.now()}`;
      const emp = { ...form, id, updatedAt: new Date().toISOString() };
      if (password) emp.password = password;  // plain text (stored locally) — swap with Firebase Auth for production

      // Persist to Firestore
      if (user?.uid) {
        await setDoc(
          doc(db, COL.employees(user.uid), id),
          { ...emp, password: undefined },    // never store passwords in Firestore
          { merge: true }
        );
      }

      const updated = editing
        ? employees.map((e) => (e.id === editing ? emp : e))
        : [...employees, emp];
      persist(updated);
      addToast(editing ? 'Employee updated ✅' : 'Employee added ✅', 'success');
      setModal(false);
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  function toggleActive(id) {
    const updated = employees.map((e) =>
      e.id === id ? { ...e, active: !e.active } : e
    );
    persist(updated);
    addToast('Status updated', 'info');
  }

  function deleteEmp(id) {
    if (!confirm('Remove this employee?')) return;
    persist(employees.filter((e) => e.id !== id));
    addToast('Employee removed', 'info');
  }

  return (
    <div className="erp-tab-enter">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Employees</h2>
          <p className="text-slate-400 text-sm">{employees.filter((e) => e.active).length} active · {employees.length} total</p>
        </div>
        <Button size="sm" onClick={openAdd}>+ Add Employee</Button>
      </div>

      <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)}
        className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-white mb-3" />

      {/* Employee cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((emp) => (
          <div key={emp.id} className="bg-white rounded-[14px] border border-slate-100 shadow-card p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {emp.name[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[14px]">{emp.name}</div>
                  <div className="text-[11px] text-slate-400">{emp.department}</div>
                </div>
              </div>
              <Badge variant={emp.active ? 'green' : 'slate'}>
                {emp.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="text-[11px] text-slate-400 mb-3 space-y-0.5">
              {emp.email && <div>📧 {emp.email}</div>}
              {emp.role  && <div>🎭 {emp.role}</div>}
              <div>🔑 {Object.values(emp.permissions || {}).filter(Boolean).length} permissions</div>
            </div>

            <div className="flex gap-1.5">
              <button onClick={() => openEdit(emp)}
                className="flex-1 text-[11px] font-bold py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 border-none cursor-pointer transition-colors">
                Edit
              </button>
              <button onClick={() => toggleActive(emp.id)}
                className={`flex-1 text-[11px] font-bold py-1.5 rounded-lg border-none cursor-pointer transition-colors ${emp.active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                {emp.active ? 'Deactivate' : 'Activate'}
              </button>
              <button onClick={() => deleteEmp(emp.id)}
                className="px-2.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 border-none cursor-pointer text-[11px] font-bold transition-colors">
                ✕
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 text-sm">
            No employees yet. Add your first team member!
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Employee' : 'Add Employee'} maxWidth="max-w-xl">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-4">
          {['info', 'login', 'permissions'].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={['flex-1 py-2 rounded-lg text-xs font-bold transition-all border-none cursor-pointer capitalize',
                t === tab ? 'bg-white text-slate-800 shadow-sm' : 'bg-transparent text-slate-500'].join(' ')}>
              {t === 'info' ? '👤 Info' : t === 'login' ? '🔐 Login' : '🔑 Permissions'}
            </button>
          ))}
        </div>

        {/* Info tab */}
        {tab === 'info' && (
          <div className="grid grid-cols-2 gap-3">
            {[['Full Name *', 'name', 'text', 'col-span-2'], ['Email *', 'email', 'email', ''],
              ['Phone', 'phone', 'tel', ''], ['Role Title', 'role', 'text', 'col-span-2']
            ].map(([label, key, type, span]) => (
              <div key={key} className={span}>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</label>
                <input type={type} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Department</label>
              <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white">
                {DEPTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Login tab */}
        {tab === 'login' && (
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
              ℹ️ Employee logs in with their email + this password from the Employee Login screen.
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Login Email</label>
              <input type="email" value={form.email || ''} readOnly
                className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] bg-slate-100 text-slate-500" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                {editing ? 'New Password (leave blank to keep)' : 'Password *'}
              </label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder={editing ? '••••••••' : 'Set employee password'}
                className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white" />
            </div>
          </div>
        )}

        {/* Permissions tab */}
        {tab === 'permissions' && (
          <div>
            {/* Role templates */}
            <div className="mb-4">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Quick Template</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(ROLE_TEMPLATES).map((t) => (
                  <button key={t} onClick={() => applyTemplate(t)}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100 cursor-pointer border-none transition-colors">
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <PermMatrix
              permissions={form.permissions || {}}
              onChange={(perms) => setForm({ ...form, permissions: perms })}
            />
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setModal(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>Save Employee</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
