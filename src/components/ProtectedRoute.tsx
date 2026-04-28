import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps any route that requires authentication.
 * - While session resolves: renders a centered spinner (avoids /login flash).
 * - If no session: redirects to /login, preserving the intended destination
 *   so the user lands back after sign-in.
 * - If authenticated: renders children normally.
 */
export function ProtectedRoute({ children }: Props) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    // Pass current location so Login can redirect back after auth
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
