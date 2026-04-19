import { useState }      from 'react';
import { useAppStore }   from '@/store';
import { Button }        from '@/components/ui/Button';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db }            from '@/config/firebase';

export default function SettingsModule() {
  const user        = useAppStore((s) => s.user);
  const settings    = useAppStore((s) => s.settings);
  const setSettings = useAppStore((s) => s.setSettings);
  const addToast    = useAppStore((s) => s.addToast);
  const [form, setForm] = useState({ ...settings });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      if (user?.uid && !user?.isDemo) {
        await setDoc(doc(db, 'businesses', user.uid), { settings: form, updatedAt: serverTimestamp() }, { merge: true });
      }
      setSettings(form);
      addToast('Settings saved ✅', 'success');
    } catch (e) {
      addToast('Error: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const Field = ({ label, name, type = 'text', span = '' }) => (
    <div className={span}>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
      <input type={type} value={form[name] || ''} onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="w-full h-9 px-3 border border-slate-200 rounded-[10px] text-[13px] outline-none focus:border-brand-500 bg-slate-50 focus:bg-white transition-colors" />
    </div>
  );

  return (
    <div className="erp-tab-enter max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-slate-800">Business Settings</h2>
        <Button onClick={handleSave} loading={saving}>Save Changes</Button>
      </div>

      {[
        { title: '🏢 Business Info', fields: [
          ['Business Name',   'businessName', 'text', 'col-span-2'],
          ['GSTIN',           'gstin'],
          ['Phone',           'phone', 'tel'],
          ['Email',           'email', 'email', 'col-span-2'],
          ['Address',         'address', 'text', 'col-span-2'],
        ]},
        { title: '💳 Payment Details', fields: [
          ['UPI ID',          'upi'],
          ['Bank Name',       'bankName'],
          ['Account Number',  'bankAcc'],
          ['IFSC Code',       'bankIfsc'],
        ]},
        { title: '📄 Invoice Defaults', fields: [
          ['Invoice Prefix',  'invoicePrefix'],
          ['Currency',        'currency'],
          ['Custom Terms',    'customTerms', 'text', 'col-span-2'],
        ]},
      ].map(({ title, fields }) => (
        <div key={title} className="bg-white rounded-[14px] border border-slate-100 shadow-card p-5 mb-4">
          <h3 className="font-bold text-slate-800 text-sm mb-4">{title}</h3>
          <div className="grid grid-cols-2 gap-3">
            {fields.map(([label, name, type = 'text', span = '']) => (
              <Field key={name} label={label} name={name} type={type} span={span} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
