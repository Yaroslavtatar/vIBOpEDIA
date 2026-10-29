import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.js';
import { api, setStoredToken, getStoredToken } from '../api/client.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, username: string, pass: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      if (data.user) {
        setUser(data.user);
        if (!getStoredToken()) {
          setStoredToken(data.user.id);
        }
      } else {
        setUser(null);
        setStoredToken(null);
      }
    } catch (err) {
      setUser(null);
      setStoredToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await api.login(email, pass);
    setStoredToken(data.token);
    setUser(data.user);
  };

  const register = async (email: string, username: string, pass: string, displayName: string) => {
    const data = await api.register(email, username, pass, displayName);
    setStoredToken(data.token);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // ignore
    }
    setStoredToken(null);
    setUser(null);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return roles.includes('guest');
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
