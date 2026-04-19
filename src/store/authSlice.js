export const createAuthSlice = (set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────
  user:        null,   // { uid, email, displayName }
  isEmployee:  false,
  employeeData:null,   // { id, name, department, permissions:{} }
  permissions: {},     // mirror of employeeData.permissions for quick lookup
  settings:    {},     // business settings
  isDemo:      false,

  // ── Actions ────────────────────────────────────────────────────────────
  setUser: (user) => set({ user }, false, 'auth/setUser'),

  setEmployee: (empData, bizUid) =>
    set(
      {
        isEmployee:   true,
        employeeData: empData,
        permissions:  empData?.permissions || {},
      },
      false,
      'auth/setEmployee'
    ),

  clearEmployee: () =>
    set(
      { isEmployee: false, employeeData: null, permissions: {} },
      false,
      'auth/clearEmployee'
    ),

  setSettings: (settings) => set({ settings }, false, 'auth/setSettings'),

  setDemo: () =>
    set(
      {
        isDemo: true,
        user: { uid: 'demo_user_001', email: 'demo@mybusiness.in', displayName: 'Demo User' },
        settings: {
          businessName: 'My Business (Demo)',
          address:      'Demo Address, India',
          phone:        '9999999999',
          gstin:        '07AABCD1234E1Z5',
          email:        'demo@mybusiness.in',
          template:     'modern',
          upi:          'demo@upi',
        },
      },
      false,
      'auth/setDemo'
    ),

  signOut: () =>
    set(
      { user: null, isEmployee: false, employeeData: null, permissions: {}, settings: {}, isDemo: false },
      false,
      'auth/signOut'
    ),

  // ── Helpers ────────────────────────────────────────────────────────────
  /** Check if current session (owner or employee) can perform an action */
  hasPermission: (key) => {
    const { isEmployee, permissions } = get();
    if (!isEmployee) return true; // owners have all permissions
    return permissions[key] === true;
  },
});
