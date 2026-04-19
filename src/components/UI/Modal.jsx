import { useEffect, useRef } from 'react';
import { createPortal }      from 'react-dom';

/**
 * Reusable modal with backdrop, animations, and focus trap.
 * Usage:
 *   <Modal open={open} onClose={close} title="Edit Item" maxWidth="max-w-lg">
 *     <div>body</div>
 *     <div slot="footer">...</div>
 *   </Modal>
 */
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg', hideClose }) {
  const boxRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,.65)', backdropFilter: 'blur(6px)', animation: 'fadeIn .2s' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={boxRef}
        className={`relative bg-white rounded-[18px] w-full ${maxWidth} max-h-[92vh] flex flex-col`}
        style={{ boxShadow: '0 24px 80px rgba(0,0,0,.22)', animation: 'slideUp .22s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-bold text-slate-800 text-base">{title}</h3>
          {!hideClose && (
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Convenience footer wrapper */
export function ModalFooter({ children }) {
  return (
    <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 flex-shrink-0">
      {children}
    </div>
  );
}
