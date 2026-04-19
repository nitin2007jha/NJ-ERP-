import { useState }    from 'react';
import { useAppStore } from '@/store';
import { signInOwner, signUpOwner } from '@/services/firebase/auth.service';
import { Button }      from '@/components/ui/Button';

export function AuthScreen() {
  const setDemo   = useAppStore((s) => s.setDemo);
  const [mode, setMode]     = useState('login');   // 'login' | 'signup'
  const [email, setEmail]   = useState('');
  const [pass,  setPass]    = useState('');
  const [biz,   setBiz]     = useState('');
  const [err,   setErr]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErr(''); setLoading(true);
    try {
      await signInOwner(email, pass);
      // onAuthChange in App.jsx will pick up the user
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    if (!biz.trim()) { setErr('Business name is required'); return; }
    setErr(''); setLoading(true);
    try {
      await signUpOwner(email, pass, biz);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg,#0d1117 0%,#064e3b 50%,#065f46 100%)' }}>
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 border-2 border-emerald-500/30 rounded-2xl flex items-center justify-center shadow-xl">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#10b981" strokeWidth="2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z" /></svg>
        </div>
        <h1 className="text-3xl font-black text-white">My Business</h1>
        <p className="text-emerald-400 text-sm mt-1 font-medium">{mode === 'login' ? 'Sign in to your ERP' : 'Create your account'}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-lg">
        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">Business Name</label>
              <input type="text" required value={biz} onChange={(e) => setBiz(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 outline-none focus:border-emerald-500 text-sm"
                placeholder="My Clinic / My Store" />
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email"
              className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 outline-none focus:border-emerald-500 text-sm"
              placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">Password</label>
            <input type="password" required value={pass} onChange={(e) => setPass(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full h-11 px-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 outline-none focus:border-emerald-500 text-sm"
              placeholder="••••••••" />
          </div>

          {err && <p className="text-red-400 text-sm">{err}</p>}

          <Button type="submit" className="w-full !py-3" loading={loading}>
            {mode === 'login' ? '🔐 Sign In' : '🚀 Create Account'}
          </Button>
        </form>

        <div className="border-t border-white/10 mt-4 pt-4 flex items-center justify-between">
          <span className="text-slate-400 text-sm">
            {mode === 'login' ? 'New here?' : 'Have an account?'}
          </span>
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); }}
            className="text-emerald-400 font-bold text-sm hover:text-emerald-300 bg-transparent border-none cursor-pointer">
            {mode === 'login' ? 'Create account →' : '← Sign in'}
          </button>
        </div>

        <div className="text-center mt-3">
          <button onClick={setDemo} className="text-amber-400 text-xs font-bold hover:text-amber-300 bg-transparent border-none cursor-pointer">
            🎮 Try Demo Mode (no account needed)
          </button>
        </div>
      </div>
    </div>
  );
}
