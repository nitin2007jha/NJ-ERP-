const VARIANTS = {
  green:  'bg-emerald-100 text-emerald-800',
  red:    'bg-red-100 text-red-800',
  amber:  'bg-amber-100 text-amber-800',
  blue:   'bg-blue-100 text-blue-800',
  purple: 'bg-purple-100 text-purple-800',
  slate:  'bg-slate-100 text-slate-600',
};

export function Badge({ variant = 'slate', children, className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold',
        VARIANTS[variant] || VARIANTS.slate,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
