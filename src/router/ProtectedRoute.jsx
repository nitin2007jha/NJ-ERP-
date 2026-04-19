import { Navigate, Outlet } from 'react-router-dom';
import { useAppStore }      from '@/store';

/**
 * Redirects to /login if no authenticated user.
 * Auth screen is handled inside App.jsx (not a route),
 * so this guard simply blocks the shell from rendering.
 */
export function ProtectedRoute() {
  const user = useAppStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
