"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { getClientAuth } from "@/lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = onAuthStateChanged(getClientAuth(), (u) => {
        setUser(u);
        setLoading(false);
      });
    } catch (err) {
      console.error("Auth provider init failed", err);
      setLoading(false);
    }
    return () => unsub?.();
  }, []);

  const value = useMemo(() => ({ user, loading }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
}
