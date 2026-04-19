import { useAppStore } from '@/store';
import { signOut }     from '@/services/firebase/auth.service';

export function useAuth() {
  const user        = useAppStore((s) => s.user);
  const isEmployee  = useAppStore((s) => s.isEmployee);
  const permissions = useAppStore((s) => s.permissions);
  const isDemo      = useAppStore((s) => s.isDemo);
  const hasPermission = useAppStore((s) => s.hasPermission);
  const doSignOut   = useAppStore((s) => s.signOut);

  async function logout() {
    if (!isDemo) await signOut();
    doSignOut();
  }

  return { user, isEmployee, permissions, isDemo, hasPermission, logout };
}
