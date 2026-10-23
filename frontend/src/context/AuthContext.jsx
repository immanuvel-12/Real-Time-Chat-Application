import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { fetchCurrentUser, loginUser, registerUser, logoutUser } from "../services/authService.js";

const AuthContext = createContext(null);

/**
 * Holds the authenticated user. On mount it asks the backend
 * (GET /api/auth/me) whether the httpOnly JWT cookie identifies a user,
 * so reloading the page keeps you signed in.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // session check in progress

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchCurrentUser();
        if (!cancelled) setUser(me);
      } catch {
        // not signed in — expected for visitors
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (credentials) => {
    const me = await loginUser(credentials);
    setUser(me);
    return me;
  };

  const register = async (payload) => {
    const me = await registerUser(payload);
    setUser(me);
    return me;
  };

  const logout = async () => {
    try {
      await logoutUser();
      toast.success("Logged out");
    } catch {
      toast.success("Logged out");
    } finally {
      setUser(null);
    }
  };

  const updateUser = (partial) => {
    setUser((prev) => ({ ...prev, ...partial }));
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
