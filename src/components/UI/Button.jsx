import { forwardRef } from 'react';

const VARIANTS = {
  primary: 'bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-[0_4px_12px_rgba(16,185,129,.28)] hover:shadow-[0_6px_20px_rgba(16,185,129,.38)] hover:-translate-y-px',
  ghost:   'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-900',
  danger:  'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white',
  icon:    'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200',
};

const SIZES = {
  sm:   'px-3 py-1.5 text-xs gap-1.5',
  md:   'px-4 py-2 text-sm gap-2',
  lg:   'px-5 py-3 text-sm gap-2',
  icon: 'p-2',
};

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading, disabled, children, className = '', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-semibold rounded-[10px] border-none',
        'cursor-pointer transition-all duration-150 active:scale-[.96] select-none',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size]       || SIZES.md,
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : children}
    </button>
  );
});
