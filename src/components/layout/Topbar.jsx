import { useRef, useEffect } from 'react';
import { useLocation }        from 'react-router-dom';
import { useAppStore }        from '@/store';
import { useOmnibox }         from '@/hooks/useOmnibox';
import { useSubscription }    from '@/hooks/useSubscription';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/invoice':   'New Invoice',
  '/records':   'Invoice Records',
  '/clients':   'Clients',
  '/inventory': 'Inventory',
  '/services':  'Services',
  '/expenses':  'Expenses',
  '/employees': 'Employees',
  '/gst':       'GST Module',
  '/analytics': 'Analytics',
  '/settings':  'Settings',
  '/daybook':   'Daybook',
};

const TIER_BADGE = {
  free_trial: { label: 'Free',      bg: '#f1f5f9', color: '#64748b' },
  pro:        { label: 'Pro ⚡',    bg: '#ecfdf5', color: '#059669' },
  enterprise: { label: 'Elite 👑',  bg: '#ede9fe', color: '#7c3aed' },
};

export function Topbar({ onMenuClick }) {
  const location          = useLocation();
  const toggleSidebar     = useAppStore((s) => s.toggleSidebar);
  const toggleVoicePanel  = useAppStore((s) => s.toggleVoicePanel);
  const { tier, promptUpgrade } = useSubscription();

  const { query, results, open, handleInput, clear } = useOmnibox();
  const inputRef  = useRef(null);
  const dropRef   = useRef(null);

  const pageTitle = PAGE_TITLES[location.pathname] || 'My Business ERP';
  const badge     = TIER_BADGE[tier] || TIER_BADGE.free_trial;

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e) {
      if (dropRef.current && !dropRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        clear();
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [clear]);

  return (
    <div
      id="topbar"
      className="h-[54px] flex items-center px-4 gap-2.5 flex-shrink-0 sticky top-0 z-20"
      style={{ background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #eef0f3' }}
    >
      {/* Hamburger (mobile) */}
      <button
        id="hamburger"
        onClick={toggleSidebar}
        className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 border-none bg-transparent cursor-pointer"
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Page title */}
      <span className="font-bold text-slate-800 text-sm flex-shrink-0 hidden sm:block">{pageTitle}</span>

      {/* ── Omnibox ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 max-w-[420px] min-w-0">
        {/* Search icon */}
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2"
        >
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => query.length > 1 && handleInput(query)}
          onKeyDown={(e) => e.key === 'Escape' && clear()}
          placeholder="Search clients, invoices, products..."
          className="w-full h-[34px] pl-8 pr-8 border border-slate-200 rounded-[10px] text-[13px] bg-slate-50 text-slate-900 outline-none transition-all focus:border-brand-500 focus:shadow-[0_0_0_3px_rgba(16,185,129,.1)] focus:bg-white placeholder:text-slate-400"
        />

        {/* Voice mic inside search */}
        <button
          onClick={() => { clear(); toggleVoicePanel(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-600 border-none bg-transparent cursor-pointer p-1 flex transition-colors"
          title="Voice search"
        >
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8"  y1="23" x2="16" y2="23" />
          </svg>
        </button>

        {/* Results dropdown */}
        {open && results.length > 0 && (
          <div
            ref={dropRef}
            className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-xl z-[9000] max-h-[380px] overflow-y-auto"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => { r.action(); clear(); }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 text-left cursor-pointer bg-transparent border-x-0 border-t-0 transition-colors"
              >
                <span className="text-base flex-shrink-0">
                  {{ invoice:'🧾', client:'👤', product:'📦', service:'✨', expense:'💸', nav:'⚡' }[r.type] || '•'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-slate-900 truncate">{r.label}</div>
                  <div className="text-[11px] text-slate-400 truncate">{r.sub}</div>
                </div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: r.badge?.bg, color: r.badge?.color }}
                >
                  {r.type}
                </span>
              </button>
            ))}
          </div>
        )}
        {open && results.length === 0 && query.length > 1 && (
          <div ref={dropRef} className="absolute top-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-xl z-[9000] px-4 py-3 text-[12px] text-slate-400" style={{ boxShadow: '0 8px 32px rgba(0,0,0,.14)' }}>
            No results for "{query}"
          </div>
        )}
      </div>

      {/* ── Voice FAB ───────────────────────────────────────────────────── */}
      <button
        onClick={toggleVoicePanel}
        title="Voice Assistant"
        className="w-[42px] h-[42px] rounded-xl border-none cursor-pointer flex-shrink-0 flex items-center justify-center text-white transition-all hover:-translate-y-px active:scale-95"
        style={{ background: 'linear-gradient(135deg,#064e3b,#10b981)', boxShadow: '0 4px 12px rgba(16,185,129,.32)' }}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.3">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8"  y1="23" x2="16" y2="23" />
        </svg>
      </button>

      {/* ── Tier badge ──────────────────────────────────────────────────── */}
      <button
        onClick={() => promptUpgrade('Upgrade your plan for premium features.')}
        className="text-[10px] font-black px-2.5 py-1 rounded-full flex-shrink-0 cursor-pointer border-none transition-opacity hover:opacity-80"
        style={{ background: badge.bg, color: badge.color }}
      >
        {badge.label}
      </button>
    </div>
  );
}
