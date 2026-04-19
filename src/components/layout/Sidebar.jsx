import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore }              from '@/store';
import { useSubscription }          from '@/hooks/useSubscription';
import { signOut }                  from '@/services/firebase/auth.service';

const NAV = [
  { label: 'Dashboard',   path: '/dashboard', icon: LayoutDashboard,  section: null           },
  { label: 'New Invoice', path: '/invoice',   icon: FilePlus,         section: 'Billing'      },
  { label: 'Records',     path: '/records',   icon: Archive,          section: null           },
  { label: 'Clients',     path: '/clients',   icon: Users,            section: 'Business'     },
  { label: 'Inventory',   path: '/inventory', icon: Package,          section: null           },
  { label: 'Services',    path: '/services',  icon: Sparkles,         section: null           },
  { label: 'Expenses',    path: '/expenses',  icon: Wallet,           section: 'Finance'      },
  { label: 'GST',         path: '/gst',       icon: Landmark,         section: null           },
  { label: 'Analytics',   path: '/analytics', icon: BarChart2,        section: null, pro: true},
  { label: 'Employees',   path: '/employees', icon: UserCheck,        section: 'Team'         },
  { label: 'Settings',    path: '/settings',  icon: Settings,         section: null           },
];

// Inline SVG icons (no external dep needed, lucide already loaded globally in index.html)
function Icon({ name, size = 16 }) {
  const icons = {
    LayoutDashboard: 'M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5zm10 0a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5zM4 15a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4zm10-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-7z',
    FilePlus:        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 9h-2v2H9v2h2v2h2v-2h2v-2h-2v-2zm1-7 5 5h-5V4z',
    Archive:         'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8zm-9 9-7-4V8.87l7 4V17zm.5-6.07L5.5 7l7-3.96L19.5 7 12.5 10.93z',
    Users:           'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm4 10v-2a4 4 0 0 0-3-3.87',
    Package:         'M16.5 9.4 7.55 4.24M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96 12 12.01l8.73-5.05M12 22.08V12',
    Sparkles:        'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.582a.5.5 0 0 1 0 .963L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
    Wallet:          'M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M3 5a2 2 0 0 0-2 2v14',
    Landmark:        'M3 22V11M21 22V11M12 22V11M3 11h18M12 2 2 7h20z',
    BarChart2:       'M18 20V10M12 20V4M6 20v-6',
    UserCheck:       'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7 3 2 2 4-4',
    Settings:        'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm7.5-3c0-.34-.03-.67-.08-1l2.16-1.68a.5.5 0 0 0 .12-.64l-2.05-3.55a.5.5 0 0 0-.61-.22l-2.55 1.02a7.5 7.5 0 0 0-1.73-1l-.38-2.72A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.42l-.38 2.72a7.5 7.5 0 0 0-1.73 1L4.85 5.12a.5.5 0 0 0-.61.22L2.19 8.89a.49.49 0 0 0 .12.64L4.47 11c-.05.33-.08.66-.08 1s.03.67.08 1L2.31 14.68a.5.5 0 0 0-.12.64l2.05 3.55a.5.5 0 0 0 .61.22l2.55-1.02c.54.38 1.12.69 1.73 1l.38 2.72c.06.24.27.42.49.42h4c.22 0 .43-.18.49-.42l.38-2.72a7.5 7.5 0 0 0 1.73-1l2.55 1.02a.5.5 0 0 0 .61-.22l2.05-3.55a.5.5 0 0 0-.12-.64L19.53 13c.05-.33.08-.66.08-1z',
    LogOut:          'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    Leaf:            'M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12',
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={icons[name] || ''} />
    </svg>
  );
}

export function Sidebar() {
  const navigate      = useNavigate();
  const location      = useLocation();
  const user          = useAppStore((s) => s.user);
  const settings      = useAppStore((s) => s.settings);
  const isEmployee    = useAppStore((s) => s.isEmployee);
  const doSignOut     = useAppStore((s) => s.signOut);
  const closeSidebar  = useAppStore((s) => s.closeSidebar);
  const { tier }      = useSubscription();

  const bizName = settings?.businessName || user?.displayName || 'My Business';

  async function handleSignOut() {
    await signOut();
    doSignOut();
  }

  function goTo(path) {
    navigate(path);
    closeSidebar();
  }

  let lastSection = null;

  return (
    <aside
      id="sidebar"
      className="w-[220px] flex-shrink-0 flex flex-col z-[100] h-full overflow-y-auto overflow-x-hidden"
      style={{ background: '#0d1117', borderRight: '1px solid rgba(255,255,255,0.07)', boxShadow: '4px 0 32px rgba(0,0,0,0.3)' }}
    >
      {/* Logo */}
      <div className="p-5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-7">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-lg">
            <Icon name="Leaf" size={18} />
          </div>
          <div>
            <div className="text-white font-bold text-sm leading-tight truncate max-w-[140px]">{bizName}</div>
            <div className="text-brand-500 text-[9px] font-bold uppercase tracking-widest">Modular Pro ERP</div>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const showSection = item.section && item.section !== lastSection;
            if (showSection) lastSection = item.section;
            const active = location.pathname === item.path;

            return (
              <div key={item.path}>
                {showSection && (
                  <div className="text-[9px] font-black text-slate-600 uppercase tracking-[.12em] px-3.5 pt-3 pb-1">
                    {item.section}
                  </div>
                )}
                <button
                  onClick={() => goTo(item.path)}
                  className={`nav-item ${active ? 'active' : ''} w-full`}
                >
                  <Icon name={item.icon?.name || 'Leaf'} size={15} />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.pro && tier === 'free_trial' && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">PRO</span>
                  )}
                </button>
              </div>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-brand-500/20 rounded-full flex items-center justify-center text-brand-400 text-xs font-bold flex-shrink-0">
            {(user?.email || 'U')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">{isEmployee ? 'Employee' : 'Owner'}</div>
            <div className="text-xs font-semibold text-slate-300 truncate">{user?.email}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSignOut}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer"
          >
            <Icon name="LogOut" size={13} />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
