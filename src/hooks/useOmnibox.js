import { useState, useCallback, useRef } from 'react';
import { useAppStore }  from '@/store';
import { matchScore }   from '@/utils/fuzzy';

const BADGE = {
  invoice: { bg: '#fef3c7', color: '#92400e' },
  client:  { bg: '#dbeafe', color: '#1e40af' },
  product: { bg: '#dcfce7', color: '#166534' },
  service: { bg: '#ede9fe', color: '#5b21b6' },
  expense: { bg: '#fee2e2', color: '#991b1b' },
  nav:     { bg: '#f1f5f9', color: '#475569' },
};

const NAV_ITEMS = [
  { kw: ['dashboard','home'],            label: 'Dashboard',        tab: 'dashboard'  },
  { kw: ['invoice','bill','billing'],    label: 'New Invoice',      tab: 'invoice'    },
  { kw: ['records','history'],           label: 'Invoice Records',  tab: 'records'    },
  { kw: ['client','customer','crm'],     label: 'Clients / CRM',    tab: 'clients'    },
  { kw: ['inventory','stock','product'], label: 'Inventory',        tab: 'inventory'  },
  { kw: ['expense','kharcha'],           label: 'Expenses',         tab: 'expenses'   },
  { kw: ['gst','tax','return'],          label: 'GST Module',       tab: 'gst'        },
  { kw: ['employee','staff'],            label: 'Employees',        tab: 'employees'  },
  { kw: ['settings','setup'],            label: 'Settings',         tab: 'settings'   },
  { kw: ['daybook','daily','cash'],      label: 'Daybook',          tab: 'daybook'    },
  { kw: ['analytics','report','chart'],  label: 'Analytics',        tab: 'analytics'  },
];

export function useOmnibox() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const debounce              = useRef(null);

  const setTab     = useAppStore((s) => s.setTab);
  const invoices   = useAppStore((s) => s.invoices);
  const clients    = useAppStore((s) => s.clients);
  const products   = useAppStore((s) => s.products);
  const services   = useAppStore((s) => s.services);
  const expenses   = useAppStore((s) => s.expenses);

  const search = useCallback((q) => {
    const raw = (q || '').toLowerCase().trim();
    if (raw.length < 2) { setResults([]); setOpen(false); return; }

    const hits = [];

    // Invoices
    invoices.forEach((inv) => {
      const s1 = matchScore(raw, inv.id || '');
      const s2 = matchScore(raw, inv.client?.name || '');
      const sc = Math.max(s1, s2);
      if (sc > 0)
        hits.push({
          type:  'invoice',
          label: `${inv.id}  ${inv.client?.name || ''}`,
          sub:   `₹${(inv.grandTotal || 0).toLocaleString('en-IN')} · ${inv.date || ''} · ${inv.paymentStatus || ''}`,
          score: sc,
          badge: BADGE.invoice,
          action: () => setTab('records'),
        });
    });

    // Clients
    clients.filter((c) => !c.isDeleted).forEach((c) => {
      const sc = Math.max(matchScore(raw, c.name || ''), matchScore(raw, c.mobile || ''));
      if (sc > 0) {
        const cnt = invoices.filter((i) => i.client?.name === c.name).length;
        hits.push({
          type:  'client',
          label: c.name,
          sub:   `${c.mobile || 'No phone'} · ${cnt} invoices`,
          score: sc,
          badge: BADGE.client,
          action: () => setTab('clients'),
        });
      }
    });

    // Products
    products.filter((p) => !p.isDeleted).forEach((p) => {
      const sc = Math.max(matchScore(raw, p.name || ''), matchScore(raw, p.category || ''));
      if (sc > 0)
        hits.push({
          type:  'product',
          label: p.name,
          sub:   `${p.category || ''} · Stock: ${p.stock ?? 0} · ₹${p.rate || 0}`,
          score: sc,
          badge: (p.stock ?? 0) <= 5 ? { bg:'#fee2e2',color:'#991b1b' } : BADGE.product,
          action: () => setTab('inventory'),
        });
    });

    // Services
    services.filter((s) => !s.isDeleted).forEach((svc) => {
      const sc = matchScore(raw, svc.name || '');
      if (sc > 0)
        hits.push({
          type:  'service',
          label: svc.name,
          sub:   `${svc.category || ''} · ₹${svc.rate || 0}`,
          score: sc,
          badge: BADGE.service,
          action: () => setTab('services'),
        });
    });

    // Expenses
    expenses.filter((e) => !e.isDeleted).forEach((e) => {
      const sc = Math.max(matchScore(raw, e.description || ''), matchScore(raw, e.category || ''));
      if (sc > 0)
        hits.push({
          type:  'expense',
          label: e.description || e.category,
          sub:   `${e.category || ''} · ₹${e.amount || 0} · ${e.date || ''}`,
          score: sc,
          badge: BADGE.expense,
          action: () => setTab('expenses'),
        });
    });

    // Navigation shortcuts
    NAV_ITEMS.forEach((n) => {
      if (n.kw.some((k) => k.includes(raw) || raw.includes(k)))
        hits.push({
          type:  'nav',
          label: `Go to ${n.label}`,
          sub:   'Navigation',
          score: 20,
          badge: BADGE.nav,
          action: () => setTab(n.tab),
        });
    });

    hits.sort((a, b) => b.score - a.score);
    setResults(hits.slice(0, 12));
    setOpen(true);
  }, [invoices, clients, products, services, expenses, setTab]);

  const handleInput = useCallback((value) => {
    setQuery(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(value), 200);
  }, [search]);

  const clear = useCallback(() => {
    setQuery('');
    setResults([]);
    setOpen(false);
  }, []);

  return { query, results, open, handleInput, clear, search };
}
