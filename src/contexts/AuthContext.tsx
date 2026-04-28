import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types/user';
import { getCurrentUser, logout as logoutService } from '@/services/authService';

interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  function setUser(user: User | null) {
    setUserState(user);
    if (typeof window !== 'undefined') {
      if (user) window.localStorage.setItem('visionai.currentUser', JSON.stringify(user));
      else window.localStorage.removeItem('visionai.currentUser');
    }
  }

  useEffect(() => {
    let mounted = true;
    async function loadUser() {
      const stored = window.localStorage.getItem('visionai.currentUser');
      if (stored) {
        try {
          setUserState(JSON.parse(stored) as User);
        } catch {
          window.localStorage.removeItem('visionai.currentUser');
        }
      }
      const remoteUser = await getCurrentUser().catch(() => null);
      if (mounted && remoteUser) setUser(remoteUser);
      if (mounted) setIsLoading(false);
    }
    loadUser();
    return () => { mounted = false; };
  }, []);

  async function logout() {
    await logoutService().catch(() => undefined);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
