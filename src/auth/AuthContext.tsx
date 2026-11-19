import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { STORAGE_KEY, setBearerToken } from "../api/client";
import type { AuthResult, AuthUser } from "../api/types";

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (result: AuthResult) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** `sessionStorage`-free on purpose: a reload during the review must not log anyone out. */
function readStoredSession(): AuthResult | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResult) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = readStoredSession();
    // Done here rather than in an effect: child effects run *before* the parent's, so a screen that
    // fetches on mount would otherwise fire its first request without the token on a hard reload.
    setBearerToken(stored?.token ?? null);
    return stored?.user ?? null;
  });

  const signIn = useCallback((result: AuthResult) => {
    setBearerToken(result.token);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    setUser(result.user);
  }, []);

  const signOut = useCallback(() => {
    setBearerToken(null);
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
}
