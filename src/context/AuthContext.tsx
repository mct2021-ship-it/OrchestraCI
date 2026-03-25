import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('token');
    } catch (e) {
      console.error('LocalStorage access failed:', e);
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  useEffect(() => {
    console.log('AuthContext: Checking token...', token ? 'Token exists' : 'No token');
    if (token) {
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(async res => {
        if (res.ok) return res.json();
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Invalid token');
      })
      .then(data => {
        setUser(data.user);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('AuthContext: Session expired or invalid token:', err.message);
        try {
          localStorage.removeItem('token');
        } catch (e) {}
        setToken(null);
        setUser(null);
        setIsLoading(false);
      });
    } else {
      console.log('AuthContext: No token, setting isLoading to false');
      setIsLoading(false);
    }
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    try {
      localStorage.setItem('token', newToken);
    } catch (e) {
      console.error('LocalStorage set failed:', e);
    }
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
    } catch (e) {
      console.error('LocalStorage remove failed:', e);
    }
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
