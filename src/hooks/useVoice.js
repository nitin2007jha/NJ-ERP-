import { useReducer, useRef, useCallback, useEffect } from 'react';
import { useAppStore }    from '@/store';
import { fuzzyMatch, titleCase } from '@/utils/fuzzy';
import { useSubscription } from './useSubscription';

/* ── State machine states ───────────────────────────────────────────────── */
export const VS = {
  IDLE:        'IDLE',
  INV_CLIENT:  'INV_CLIENT',
  INV_ITEM:    'INV_ITEM',
  INV_QTY:     'INV_QTY',
  INV_CONFIRM: 'INV_CONFIRM',
  CRM_LOOKUP:  'CRM_LOOKUP',
  CRM_CONFIRM: 'CRM_CONFIRM',
  STOCK_ITEM:  'STOCK_ITEM',
  GST_AMOUNT:  'GST_AMOUNT',
  GST_RATE:    'GST_RATE',
};

/* ── Intent patterns ────────────────────────────────────────────────────── */
const INTENTS = [
  { r: /\b(new invoice|naya bill|bill banao|invoice banao|create invoice|invoice chahiye)\b/i, v: 'START_INVOICE' },
  { r: /\b(client check|client balance|purana client|check client|client dekho)\b/i,          v: 'CRM_CHECK'     },
  { r: /\b(check stock|stock check|kitna stock|stock dekho|stock batao)\b/i,                  v: 'STOCK_CHECK'   },
  { r: /\b(aaj ki report|today report|daily report|report dikhao|sales kitni)\b/i,            v: 'DAILY_REPORT'  },
  { r: /\b(gst calculate|gst nikalo|tax calculate|gst batao)\b/i,                             v: 'GST_CALC'      },
  { r: /\b(upgrade|subscription|pro plan|premium plan)\b/i,                                   v: 'SHOW_UPGRADE'  },
  { r: /\b(dashboard|home screen|ghar)\b/i,                                                   v: 'NAV_dashboard' },
  { r: /\b(invoice tab|billing tab)\b/i,                                                      v: 'NAV_invoice'   },
  { r: /\b(inventory tab|products tab|stock tab)\b/i,                                         v: 'NAV_inventory' },
  { r: /\b(clients tab|crm tab|customer tab)\b/i,                                             v: 'NAV_clients'   },
  { r: /\b(expenses tab|kharche tab)\b/i,                                                     v: 'NAV_expenses'  },
  { r: /\b(settings tab|setting tab)\b/i,                                                     v: 'NAV_settings'  },
  { r: /\b(cancel|band karo|stop|rukja|chhodo)\b/i,                                           v: 'CANCEL'        },
];

function detectIntent(t) {
  for (const { r, v } of INTENTS) if (r.test(t)) return v;
  return 'UNKNOWN';
}

function parseNum(t) {
  const MAP = { ek:1,do:2,teen:3,char:4,paanch:5,cheh:6,saat:7,aath:8,nau:9,das:10,bees:20,
                one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10 };
  const lo = (t || '').toLowerCase().trim();
  if (MAP[lo]) return MAP[lo];
  const n = parseFloat((t || '').replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

/* ── Reducer ────────────────────────────────────────────────────────────── */
const initialState = {
  machineState: VS.IDLE,
  ctx:          { items: [] },
  logs:         [],           // [{ id, msg, type }]
  transcript:   '',
  prompt:       'Say a command or tap a quick button...',
  title:        'Voice Assistant',
  listening:    false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_STATE':    return { ...state, machineState: action.payload };
    case 'SET_CTX':      return { ...state, ctx: { ...state.ctx, ...action.payload } };
    case 'RESET_CTX':    return { ...state, ctx: { items: [] } };
    case 'SET_PROMPT':   return { ...state, prompt: action.payload };
    case 'SET_TITLE':    return { ...state, title: action.payload };
    case 'SET_TRANSCRIPT': return { ...state, transcript: action.payload };
    case 'SET_LISTENING':  return { ...state, listening: action.payload };
    case 'ADD_LOG': {
      const log = { id: Date.now(), msg: action.msg, logType: action.logType };
      return { ...state, logs: [log, ...state.logs].slice(0, 20) };
    }
    case 'FULL_RESET':
      return { ...initialState, logs: state.logs };
    default:
      return state;
  }
}

/* ── Hook ───────────────────────────────────────────────────────────────── */
export function useVoice() {
  const [state, dispatch]  = useReducer(reducer, initialState);
  const recRef             = useRef(null);
  const { promptUpgrade }  = useSubscription();

  // Store selectors
  const setTab    = useAppStore((s) => s.setTab);
  const addToast  = useAppStore((s) => s.addToast);
  const invoices  = useAppStore((s) => s.invoices);
  const clients   = useAppStore((s) => s.clients);
  const products  = useAppStore((s) => s.products);
  const services  = useAppStore((s) => s.services);

  /* ── TTS ─────────────────────────────────────────────────────────────── */
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u     = new SpeechSynthesisUtterance(text);
    u.lang      = 'hi-IN';
    u.rate      = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const v      = voices.find((x) => x.lang === 'en-IN') || voices.find((x) => x.lang.startsWith('en')) || voices[0];
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  }, []);

  /* ── Log helpers ─────────────────────────────────────────────────────── */
  const log = useCallback((msg, logType = 'info') => {
    dispatch({ type: 'ADD_LOG', msg, logType });
  }, []);

  /* ── Navigation ──────────────────────────────────────────────────────── */
  const nav = useCallback((tab) => {
    setTab(tab);
    log(`Navigated → ${tab}`, 'nav');
  }, [setTab, log]);

  /* ── Reset ───────────────────────────────────────────────────────────── */
  const reset = useCallback((msg) => {
    if (recRef.current && state.listening) {
      try { recRef.current.stop(); } catch (_) {}
    }
    dispatch({ type: 'FULL_RESET' });
    if (msg) { speak(msg); log(msg, 'info'); }
  }, [speak, log, state.listening]);

  /* ── Pending balance helper ──────────────────────────────────────────── */
  const pendingBal = (clientName) =>
    invoices
      .filter((i) => i.client?.name === clientName && i.paymentStatus !== 'paid' && i.status === 'final')
      .reduce((s, i) => s + (i.grandTotal || 0), 0);

  /* ── Main dispatch ───────────────────────────────────────────────────── */
  const handleTranscript = useCallback((raw) => {
    const t = (raw || '').trim();
    dispatch({ type: 'SET_TRANSCRIPT', payload: t });
    log(`You: "${t}"`, 'info');

    if (/\b(cancel|band karo|stop|rukja|chhodo)\b/i.test(t)) {
      reset('Cancelled.');
      return;
    }

    const ms = state.machineState;

    if (ms === VS.IDLE) {
      const intent = detectIntent(t);

      if (intent.startsWith('NAV_')) {
        const tab = intent.replace('NAV_', '');
        nav(tab);
        speak(`Opening ${tab}.`);
        log(`Opened ${tab}`, 'action');
        return;
      }

      switch (intent) {
        case 'START_INVOICE': {
          dispatch({ type: 'SET_STATE',  payload: VS.INV_CLIENT });
          dispatch({ type: 'RESET_CTX' });
          dispatch({ type: 'SET_TITLE',  payload: 'Invoice Mode' });
          dispatch({ type: 'SET_PROMPT', payload: 'Client ka naam boliye...' });
          nav('invoice');
          speak('Invoice start. Client ka naam boliye.');
          log('Invoice flow started', 'action');
          break;
        }
        case 'CRM_CHECK': {
          dispatch({ type: 'SET_STATE',  payload: VS.CRM_LOOKUP });
          dispatch({ type: 'SET_TITLE',  payload: 'CRM Lookup' });
          dispatch({ type: 'SET_PROMPT', payload: 'Client ka naam boliye...' });
          speak('Client ka naam boliye.');
          log('CRM lookup started', 'action');
          break;
        }
        case 'STOCK_CHECK': {
          dispatch({ type: 'SET_STATE',  payload: VS.STOCK_ITEM });
          dispatch({ type: 'SET_TITLE',  payload: 'Stock Check' });
          dispatch({ type: 'SET_PROMPT', payload: 'Kaunsa item check karna hai?' });
          speak('Kaunsa item ka stock check karna hai?');
          log('Stock check started', 'action');
          break;
        }
        case 'DAILY_REPORT': {
          const today = new Date().toISOString().slice(0, 10);
          const todayInv = invoices.filter((i) => i.date === today && i.status === 'final');
          const total    = todayInv.reduce((s, i) => s + (i.grandTotal || 0), 0);
          const paid     = todayInv.filter((i) => i.paymentStatus === 'paid').reduce((s, i) => s + (i.grandTotal || 0), 0);
          const msg      = `Today: ${todayInv.length} bills. Total ₹${total.toLocaleString('en-IN')}. Received ₹${paid.toLocaleString('en-IN')}. Pending ₹${(total - paid).toLocaleString('en-IN')}.`;
          speak(msg);
          log(msg, 'action');
          addToast(`📊 ${todayInv.length} bills | ₹${total.toLocaleString('en-IN')} today`);
          nav('dashboard');
          break;
        }
        case 'GST_CALC': {
          dispatch({ type: 'SET_STATE',  payload: VS.GST_AMOUNT });
          dispatch({ type: 'SET_TITLE',  payload: 'GST Calculator' });
          dispatch({ type: 'SET_PROMPT', payload: 'Amount boliye (e.g. "1000")' });
          speak('Amount boliye.');
          log('GST calculator started', 'action');
          break;
        }
        case 'SHOW_UPGRADE': {
          promptUpgrade('You asked about upgrading your plan.');
          speak('Opening upgrade options.');
          break;
        }
        default: {
          // Fallback: treat as search query
          addToast(`🔍 Searching: ${t}`);
          log(`Search: ${t}`, 'search');
          speak(`Searching for: ${t}`);
        }
      }
      return;
    }

    // ── Sub-state handlers ───────────────────────────────────────────────
    if (ms === VS.INV_CLIENT) {
      const found = clients.find((c) => !c.isDeleted && fuzzyMatch(t, c.name));
      if (found) {
        dispatch({ type: 'SET_CTX', payload: { client: found } });
        const bal = pendingBal(found.name);
        const msg = `Client: ${found.name}.${bal > 0 ? ` Pending ₹${bal.toLocaleString('en-IN')}.` : ''} Item ka naam boliye.`;
        speak(msg); log(msg, 'action');
      } else {
        const client = { name: titleCase(t), mobile: '', gstin: '', address: '' };
        dispatch({ type: 'SET_CTX', payload: { client } });
        speak(`New client: ${client.name}. Item ka naam boliye.`);
        log(`New client: ${client.name}`, 'action');
      }
      dispatch({ type: 'SET_STATE',  payload: VS.INV_ITEM });
      dispatch({ type: 'SET_PROMPT', payload: 'Item ya service ka naam boliye...' });
      return;
    }

    if (ms === VS.INV_ITEM) {
      if (/\b(done|ho gaya|bas|finish|save|finalize|confirm)\b/i.test(t)) {
        dispatch({ type: 'SET_STATE', payload: VS.INV_CONFIRM });
        speak('Items added. Save karna hai? Haan ya nahi?');
        dispatch({ type: 'SET_PROMPT', payload: '"Haan" to save, "Nahi" to add more...' });
        return;
      }
      const all = [...products, ...services].filter((p) => !p.isDeleted);
      const found = all.find((p) => fuzzyMatch(t, p.name));
      if (found) {
        dispatch({ type: 'SET_CTX',   payload: { _pendingItem: found } });
        dispatch({ type: 'SET_STATE',  payload: VS.INV_QTY });
        dispatch({ type: 'SET_PROMPT', payload: 'Quantity boliye (1, 2, teen...)' });
        speak(`${found.name} mila. Kitni quantity?`);
        log(`Item selected: ${found.name}`, 'action');
      } else {
        speak(`"${t}" item nahi mila. Dobara boliye.`);
        log(`Item not found: ${t}`, 'err');
      }
      return;
    }

    if (ms === VS.INV_QTY) {
      const qty  = parseNum(t);
      const item = state.ctx?._pendingItem;
      if (!qty || qty < 1) { speak('Quantity samajh nahi aaya. Phir boliye.'); return; }
      if (!item)            { speak('Pehle item ka naam boliye.'); dispatch({ type: 'SET_STATE', payload: VS.INV_ITEM }); return; }
      const rate  = Number(item.rate) || 0;
      const li    = { name: item.name, qty, rate, gst: Number(item.gst) || 0, hsn: item.hsn || '', total: qty * rate };
      const items = [...(state.ctx.items || []), li];
      const sub   = items.reduce((s, x) => s + x.total, 0);
      dispatch({ type: 'SET_CTX', payload: { items, _pendingItem: null } });
      dispatch({ type: 'SET_STATE',  payload: VS.INV_ITEM });
      dispatch({ type: 'SET_PROMPT', payload: 'Aur item boliye ya "save" boliye...' });
      const msg = `${qty} × ${item.name} added. Subtotal ₹${sub.toLocaleString('en-IN')}. Aur item boliye ya "save" boliye.`;
      speak(msg); log(msg, 'action');
      return;
    }

    if (ms === VS.INV_CONFIRM) {
      if (/\b(yes|haan|ha|ok|theek|save|confirm)\b/i.test(t)) {
        speak('Invoice save ho raha hai.');
        log('Invoice confirmed ✅', 'action');
        // Signal to InvoiceDraft component via store
        useAppStore.setState({ _voiceInvoiceConfirmed: true });
        reset();
      } else {
        dispatch({ type: 'SET_STATE',  payload: VS.INV_ITEM });
        dispatch({ type: 'SET_PROMPT', payload: 'Item ka naam boliye...' });
        speak('Ok, aur item add karo.');
      }
      return;
    }

    if (ms === VS.CRM_LOOKUP) {
      const matches = clients.filter((c) => !c.isDeleted && fuzzyMatch(t, c.name));
      if (!matches.length) {
        speak(`"${t}" naam ka client nahi mila.`);
        log(`Client not found: ${t}`, 'err');
        reset(); return;
      }
      const c   = matches[0];
      const bal = pendingBal(c.name);
      const cnt = invoices.filter((i) => i.client?.name === c.name).length;
      const msg = `${c.name} found. ${cnt} invoices.${bal > 0 ? ` Pending ₹${bal.toLocaleString('en-IN')}.` : ''} Naya invoice banana hai?`;
      dispatch({ type: 'SET_CTX',   payload: { crmClient: c } });
      dispatch({ type: 'SET_STATE',  payload: VS.CRM_CONFIRM });
      dispatch({ type: 'SET_PROMPT', payload: '"Haan" — new invoice, "Nahi" — cancel' });
      speak(msg); log(msg, 'action');
      nav('clients');
      return;
    }

    if (ms === VS.CRM_CONFIRM) {
      if (/\b(yes|haan|ha|invoice|bill)\b/i.test(t) && state.ctx?.crmClient) {
        dispatch({ type: 'SET_CTX',   payload: { client: state.ctx.crmClient, items: [] } });
        dispatch({ type: 'SET_STATE',  payload: VS.INV_ITEM });
        dispatch({ type: 'SET_TITLE',  payload: 'Invoice Mode' });
        dispatch({ type: 'SET_PROMPT', payload: 'Item ka naam boliye...' });
        nav('invoice');
        speak('Invoice tab mein client fill ho gaya. Item boliye.');
        log('CRM → Invoice flow', 'action');
      } else { reset('Okay.'); }
      return;
    }

    if (ms === VS.STOCK_ITEM) {
      const all = products.filter((p) => !p.isDeleted && fuzzyMatch(t, p.name));
      if (!all.length) { speak(`"${t}" nahi mila.`); log(`Not found: ${t}`, 'err'); reset(); return; }
      const msg = all.slice(0, 3).map((p) => `${p.name}: ${p.stock ?? 0} units${p.stock <= 5 ? ' (LOW)' : ''}`).join('. ');
      speak(msg); log(msg, 'action');
      nav('inventory');
      reset(); return;
    }

    if (ms === VS.GST_AMOUNT) {
      const a = parseNum(t);
      if (!a) { speak('Amount samajh nahi aaya.'); return; }
      dispatch({ type: 'SET_CTX',   payload: { gstAmt: a } });
      dispatch({ type: 'SET_STATE',  payload: VS.GST_RATE });
      dispatch({ type: 'SET_PROMPT', payload: 'GST rate boliye: 5, 12, 18, ya 28' });
      speak('GST rate kya hai? 5, 12, 18 ya 28?');
      return;
    }

    if (ms === VS.GST_RATE) {
      const r = parseNum(t);
      if (!r) { speak('Rate samajh nahi aaya.'); return; }
      const a    = state.ctx.gstAmt;
      const tax  = (a * r) / 100;
      const cgst = tax / 2;
      const msg  = `Amount ₹${a.toLocaleString('en-IN')}. GST ${r}%: ₹${tax.toLocaleString('en-IN')}. CGST ₹${cgst.toLocaleString('en-IN')}, SGST ₹${cgst.toLocaleString('en-IN')}. Total ₹${(a + tax).toLocaleString('en-IN')}.`;
      speak(msg); log(msg, 'action');
      addToast(`GST ${r}%: ₹${tax.toLocaleString('en-IN')} | Total: ₹${(a + tax).toLocaleString('en-IN')}`);
      reset(); return;
    }
  }, [state, clients, products, services, invoices, speak, log, nav, reset, addToast, promptUpgrade]);

  /* ── SpeechRecognition ───────────────────────────────────────────────── */
  const toggle = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { addToast('Voice not supported in this browser', 'error'); return; }

    if (state.listening) {
      try { recRef.current?.stop(); } catch (_) {}
      return;
    }

    const rec         = new SR();
    rec.continuous    = false;
    rec.interimResults = true;
    rec.lang          = 'hi-IN';
    recRef.current    = rec;

    rec.onstart  = () => dispatch({ type: 'SET_LISTENING', payload: true });
    rec.onend    = () => dispatch({ type: 'SET_LISTENING', payload: false });
    rec.onerror  = (e) => {
      dispatch({ type: 'SET_LISTENING', payload: false });
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        addToast(`Voice error: ${e.error}`, 'error');
        log(`Voice error: ${e.error}`, 'err');
      }
    };
    rec.onresult = (e) => {
      let interim = '', final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final   += e.results[i][0].transcript;
        else                      interim += e.results[i][0].transcript;
      }
      if (interim) dispatch({ type: 'SET_TRANSCRIPT', payload: interim });
      if (final)   handleTranscript(final);
    };

    try { rec.start(); } catch (_) {}
  }, [state.listening, handleTranscript, addToast, log]);

  // Preload voices on mount
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  return {
    ...state,
    toggle,
    reset,
    quickCommand: (cmd) => handleTranscript(cmd),
  };
}
