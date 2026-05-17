import React, { createContext, useState, useEffect, useContext } from 'react';
import type { SULUser } from '../types/index';

interface AuthContextType {
  user: SULUser | null; // ✅ Usa SULUser
  token: string | null;
  login: (userData: SULUser, token: string) => void;
  logout: () => void;
  updatePasswordStatus: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SULUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('sul_user');
    const savedToken = localStorage.getItem('sul_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = (userData: SULUser, inputToken: string) => {
    setUser(userData);
    setToken(inputToken);
    localStorage.setItem('sul_user', JSON.stringify(userData));
    localStorage.setItem('sul_token', inputToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sul_user');
    localStorage.removeItem('sul_token');
  };

  const updatePasswordStatus = () => {
    if (user) {
      const updatedUser = { ...user, requirePasswordChange: false };
      setUser(updatedUser);
      localStorage.setItem('sul_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updatePasswordStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};