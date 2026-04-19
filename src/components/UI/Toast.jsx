import { useAppStore } from '@/store';

const TYPE_STYLES = {
  info:    'bg-slate-800 text-white',
  success: 'bg-brand-600 text-white',
  error:   'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
};

const TYPE_ICONS = {
  info:    'ℹ️',
  success: '✅',
  error:   '❌',
  warning: '⚠️',
};

export function ToastContainer() {
  const toasts      = useAppStore((s) => s.toasts);
  const removeToast = useAppStore((s) => s.removeToast);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={[
            'pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl',
            'shadow-lg text-sm font-semibold cursor-pointer max-w-xs',
            'animate-[slideUp_.2s_ease-out]',
            TYPE_STYLES[t.type] || TYPE_STYLES.info,
          ].join(' ')}
        >
          <span>{TYPE_ICONS[t.type] || '💬'}</span>
          <span className="leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
