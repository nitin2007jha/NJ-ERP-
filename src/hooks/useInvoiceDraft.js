/**
 * Convenience hook for invoice draft operations.
 * Wraps store actions + provides computed totals reactively.
 */
import { useAppStore } from '@/store';

export function useInvoiceDraft() {
  const draft            = useAppStore((s) => s.draft);
  const patchDraft       = useAppStore((s) => s.patchDraft);
  const setDraftClient   = useAppStore((s) => s.setDraftClient);
  const addDraftItem     = useAppStore((s) => s.addDraftItem);
  const updateDraftItem  = useAppStore((s) => s.updateDraftItem);
  const removeDraftItem  = useAppStore((s) => s.removeDraftItem);
  const getDraftTotals   = useAppStore((s) => s.getDraftTotals);
  const resetDraft       = useAppStore((s) => s.resetDraft);

  return {
    draft,
    totals: getDraftTotals(),
    patchDraft,
    setClient:   setDraftClient,
    addItem:     addDraftItem,
    updateItem:  updateDraftItem,
    removeItem:  removeDraftItem,
    reset:       resetDraft,
  };
}
