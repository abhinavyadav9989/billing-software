import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import supabase from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ ok: boolean; needsVerification?: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const profileName = (sessionUser.user_metadata as any)?.full_name || sessionUser.email?.split('@')[0] || '';
        setUser({ id: sessionUser.id, email: sessionUser.email || '', name: profileName, createdAt: sessionUser.created_at || new Date().toISOString() });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };
    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user;
      if (sessionUser) {
        const profileName = (sessionUser.user_metadata as any)?.full_name || sessionUser.email?.split('@')[0] || '';
        setUser({ id: sessionUser.id, email: sessionUser.email || '', name: profileName, createdAt: sessionUser.created_at || new Date().toISOString() });
      } else {
        setUser(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login: AuthContextType['login'] = async (email, password) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { ok: false, error: error.message };
      return { ok: true };
    } finally {
      setIsLoading(false);
    }
  };

  const register: AuthContextType['register'] = async (email, password, name) => {
    setIsLoading(true);
    try {
      const siteUrl = (import.meta as any).env?.VITE_SITE_URL || window.location.origin;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          // Always redirect to a stable, configured domain to avoid preview 404s
          emailRedirectTo: `${siteUrl}/login`
        }
      });
      if (error) return { ok: false, error: error.message };
      // If email confirmations are ON, user must verify before session exists
      const needsVerification = !data.session;
      return { ok: true, needsVerification };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, register, logout, isLoading }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};