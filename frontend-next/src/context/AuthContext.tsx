'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getAuth, clearAuth } from '@/lib/api';
import type { AuthUser } from '@/types';

interface AuthContextType {
  auth: AuthUser | null;
  setAuth: (auth: AuthUser | null) => void;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAuthState(getAuth());
    setIsLoading(false);
  }, []);

  const setAuth = (newAuth: AuthUser | null) => {
    setAuthState(newAuth);
  };

  const logout = () => {
    clearAuth();
    setAuthState(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{
      auth,
      setAuth,
      logout,
      isAdmin: auth?.userRole === 'admin',
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
