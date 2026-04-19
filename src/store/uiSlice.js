export const createUISlice = (set, get) => ({
  activeTab:       'dashboard',
  voicePanelOpen:  false,
  upgradeModalOpen: false,
  sidebarOpen:     false,   // mobile
  toasts:          [],

  setTab: (tab) => set({ activeTab: tab }, false, 'ui/setTab'),

  toggleSidebar: () =>
    set((s) => ({ sidebarOpen: !s.sidebarOpen }), false, 'ui/toggleSidebar'),

  closeSidebar: () => set({ sidebarOpen: false }, false, 'ui/closeSidebar'),

  openVoicePanel:  () => set({ voicePanelOpen: true },  false, 'ui/openVoicePanel'),
  closeVoicePanel: () => set({ voicePanelOpen: false }, false, 'ui/closeVoicePanel'),
  toggleVoicePanel: () =>
    set((s) => ({ voicePanelOpen: !s.voicePanelOpen }), false, 'ui/toggleVoicePanel'),

  openUpgradeModal:  () => set({ upgradeModalOpen: true },  false, 'ui/openUpgrade'),
  closeUpgradeModal: () => set({ upgradeModalOpen: false }, false, 'ui/closeUpgrade'),

  addToast: (message, type = 'info') => {
    const id = Date.now();
    set(
      (s) => ({ toasts: [...s.toasts, { id, message, type }] }),
      false,
      'ui/addToast'
    );
    setTimeout(() => {
      set(
        (s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }),
        false,
        'ui/removeToast'
      );
    }, 3500);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }), false, 'ui/removeToast'),
});
