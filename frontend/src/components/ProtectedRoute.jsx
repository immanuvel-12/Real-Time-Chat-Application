import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth.js";

/**
 * Guards private routes. While the session check runs, show a splash;
 * unauthenticated visitors are redirected to /login and the blocked URL is
 * preserved so they come back after signing in.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-jet">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-cerulean" aria-label="Loading" />
          <p className="text-sm text-text-secondary">Loading ChatConnect…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
