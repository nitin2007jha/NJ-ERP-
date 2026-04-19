import { useEffect, useState } from 'react';
import { BrowserRouter }        from 'react-router-dom';
import { useAppStore }          from '@/store';
import { AppRoutes }            from '@/router/AppRoutes';
import { useRealtimeSync }      from '@/hooks/useRealtimeSync';
import { onAuthChange, fetchUserSettings } from '@/services/firebase/auth.service';
import { AuthScreen }           from './AuthScreen';

function SyncLayer() {
  useRealtimeSync();  // attaches all Firestore listeners once user is set
  return null;
}

export default function App() {
  const user        = useAppStore((s) => s.user);
  const setUser     = useAppStore((s) => s.setUser);
  const setSettings = useAppStore((s) => s.setSettings);
  const doSignOut   = useAppStore((s) => s.signOut);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthChange(async (fbUser) => {
      if (fbUser) {
        setUser({ uid: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName });
        // Fetch business settings
        const biz = await fetchUserSettings(fbUser.uid);
        if (biz?.settings) setSettings(biz.settings);
      } else {
        doSignOut();
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  if (!authReady) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#064e3b,#0d1117)' }}>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-4 bg-white/10 rounded-2xl flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" />
            </svg>
          </div>
          <div className="text-white font-black text-2xl mb-1">My Business</div>
          <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Initializing...</div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {user ? (
        <>
          <SyncLayer />
          <AppRoutes />
        </>
      ) : (
        <AuthScreen />
      )}
    </BrowserRouter>
  );
}
