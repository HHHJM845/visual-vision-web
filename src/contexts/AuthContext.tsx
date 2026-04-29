import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { User } from '@/types/user';
import { getCurrentUser, logout as logoutService } from '@/services/authService';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const CURRENT_USER_KEY = 'visionai.currentUser';
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function setUser(nextUser: User | null) {
    setUserState(nextUser);
    if (typeof window === 'undefined') return;
    if (nextUser) window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(nextUser));
    else window.localStorage.removeItem(CURRENT_USER_KEY);
  }

  async function refreshUser() {
    const current = await getCurrentUser().catch(() => null);
    setUser(current);
    return current;
  }

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const stored =
        !isSupabaseConfigured && typeof window !== 'undefined'
          ? window.localStorage.getItem(CURRENT_USER_KEY)
          : null;
      if (stored) {
        try {
          setUserState(JSON.parse(stored) as User);
        } catch {
          window.localStorage.removeItem(CURRENT_USER_KEY);
        }
      }

      const current = await getCurrentUser().catch(() => null);
      if (mounted) {
        setUser(current);
        setIsLoading(false);
      }
    }

    loadUser();

    const subscription = isSupabaseConfigured
      ? supabase.auth.onAuthStateChange((event) => {
          if (event === 'SIGNED_OUT') {
            setUser(null);
            setIsLoading(false);
            return;
          }

          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            refreshUser().finally(() => setIsLoading(false));
          }
        }).data.subscription
      : null;

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function logout() {
    await logoutService().catch(() => undefined);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
