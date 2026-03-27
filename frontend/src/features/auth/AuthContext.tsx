import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import authService from '@/services/authService';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, AUTH_ROLES_KEY } from '@/services/api';
import type { LoginRequest } from '@/types';

type AppRole = 'KARARGAH_ADMIN' | 'ORDU_KOMUTANI' | 'HAREKAT_SUBAYI';

export interface AuthUser {
  username: string;
  role: AppRole;
}

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthUser;
    if (parsed?.username && parsed?.role) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [user, setUser] = useState<AuthUser | null>(() => parseStoredUser());

  const clearState = () => {
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleForcedLogout = () => {
      clearState();
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    token,
    user,
    isAuthenticated: !!token,
    login: async (credentials: LoginRequest) => {
      const response = await authService.login(credentials);
      const nextUser: AuthUser = { username: response.username, role: response.role };
      setToken(response.token);
      setUser(nextUser);
    },
    logout: () => {
      authService.logout();
      localStorage.removeItem(AUTH_ROLES_KEY);
      clearState();
    },
  }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
