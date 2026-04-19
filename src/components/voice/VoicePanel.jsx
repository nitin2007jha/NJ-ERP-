import { useAppStore } from '@/store';
import { useVoice, VS } from '@/hooks/useVoice';

const QUICK_CMDS = [
  { label: '🧾 New Invoice',   cmd: 'naya bill banao'    },
  { label: '📦 Stock Check',   cmd: 'stock check karo'   },
  { label: '📊 Today Report',  cmd: 'aaj ki report'      },
  { label: '🧮 GST Calc',      cmd: 'gst calculate'      },
  { label: '👤 Client Check',  cmd: 'client check karo'  },
];

const STATE_COLORS = {
  [VS.IDLE]:        '#10b981',
  [VS.INV_CLIENT]:  '#3b82f6',
  [VS.INV_ITEM]:    '#8b5cf6',
  [VS.INV_QTY]:     '#f59e0b',
  [VS.INV_CONFIRM]: '#059669',
  [VS.CRM_LOOKUP]:  '#06b6d4',
  [VS.CRM_CONFIRM]: '#059669',
  [VS.STOCK_ITEM]:  '#f97316',
  [VS.GST_AMOUNT]:  '#ec4899',
  [VS.GST_RATE]:    '#ec4899',
};

const LOG_STYLES = {
  info:   { icon: '💬', color: '#64748b' },
  action: { icon: '✅', color: '#059669' },
  err:    { icon: '❌', color: '#dc2626' },
  nav:    { icon: '🔀', color: '#3b82f6' },
  search: { icon: '🔍', color: '#7c3aed' },
};

export function VoicePanel() {
  const open         = useAppStore((s) => s.voicePanelOpen);
  const closePanel   = useAppStore((s) => s.closeVoicePanel);
  const voice        = useVoice();

  if (!open) return null;

  const stateColor = STATE_COLORS[voice.machineState] || '#10b981';
  const isIdle     = voice.machineState === VS.IDLE;

  return (
    <div
      style={{
        position: 'fixed', bottom: 76, right: 18, zIndex: 600,
        width: 'min(340px, calc(100vw - 36px))',
        background: '#fff', borderRadius: 18,
        boxShadow: '0 16px 64px rgba(0,0,0,.2)',
        border: '1px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'slideUp .22s ease-out',
      }}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div style={{ padding: '13px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg,#064e3b,${stateColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .3s' }}>
          <MicIcon color="white" size={14} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{voice.title}</div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            {voice.listening ? '🔴 Listening...' : isIdle ? 'Tap mic to speak' : `State: ${voice.machineState}`}
          </div>
        </div>

        {/* Wave bars */}
        <div className="voice-wave" style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
          {[30, 60, 100, 70, 35].map((h, i) => (
            <span key={i} style={{ width: 3, borderRadius: 3, background: voice.listening ? '#ef4444' : stateColor, height: `${h}%`, display: 'block' }} />
          ))}
        </div>

        <button onClick={() => { voice.reset(); closePanel(); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, display: 'flex', flexShrink: 0 }}>
          <CloseIcon />
        </button>
      </div>

      {/* ── Prompt ──────────────────────────────────────────────────── */}
      <div style={{ padding: '11px 15px 5px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Waiting for</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{voice.prompt}</div>
      </div>

      {/* ── Transcript ──────────────────────────────────────────────── */}
      <div style={{ padding: '5px 15px 10px' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 3 }}>You said</div>
        <div style={{ fontSize: 13, color: '#64748b', minHeight: 18, fontStyle: 'italic', wordBreak: 'break-word', opacity: voice.transcript ? 1 : 0.4 }}>
          {voice.transcript || '—'}
        </div>
      </div>

      {/* ── Action log ──────────────────────────────────────────────── */}
      {voice.logs.length > 0 && (
        <div style={{ padding: '0 15px 8px', maxHeight: 110, overflowY: 'auto' }}>
          {voice.logs.slice(0, 6).map((entry) => {
            const style = LOG_STYLES[entry.logType] || LOG_STYLES.info;
            return (
              <div key={entry.id} style={{ display: 'flex', gap: 6, padding: '3px 0', borderBottom: '1px solid #f8fafc', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, flexShrink: 0 }}>{style.icon}</span>
                <span style={{ fontSize: 11, color: style.color, lineHeight: 1.4 }}>{entry.msg}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Quick commands ───────────────────────────────────────────── */}
      <div style={{ padding: '8px 15px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {QUICK_CMDS.map((c) => (
          <button
            key={c.cmd}
            onClick={() => voice.quickCommand(c.cmd)}
            style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', color: '#475569', transition: 'all .15s', fontFamily: 'inherit' }}
            onMouseEnter={(e) => { e.target.style.background = '#ecfdf5'; e.target.style.color = '#059669'; e.target.style.borderColor = '#a7f3d0'; }}
            onMouseLeave={(e) => { e.target.style.background = '#f8fafc'; e.target.style.color = '#475569'; e.target.style.borderColor = '#e2e8f0'; }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* ── Mic button ──────────────────────────────────────────────── */}
      <div style={{ padding: '8px 15px 14px', display: 'flex', gap: 8 }}>
        <button
          onClick={voice.toggle}
          style={{
            flex: 1, height: 40, border: 'none', borderRadius: 10, cursor: 'pointer',
            background: voice.listening
              ? 'linear-gradient(135deg,#dc2626,#ef4444)'
              : 'linear-gradient(135deg,#064e3b,#10b981)',
            color: '#fff', fontSize: 13, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            animation: voice.listening ? 'erpPulse .8s ease-in-out infinite' : 'none',
            fontFamily: 'inherit',
          }}
        >
          <MicIcon color="white" size={16} />
          {voice.listening ? 'Listening… (tap to stop)' : 'Tap to speak'}
        </button>
        <button
          onClick={() => voice.reset('Cancelled.')}
          style={{ height: 40, padding: '0 14px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function MicIcon({ color = 'currentColor', size = 17 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
