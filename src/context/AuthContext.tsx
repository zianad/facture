import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
// Fix: Use relative path for import
import { User } from '../types';
// In a real app, you would have a proper API for this.
// For this example, we'll hardcode a user for simplicity.
const FAKE_USER: User = { id: '1', username: 'admin', password: 'password123' };

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  // This is just an example, in a real app you'd fetch users from a DB
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  getUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Check for logged in user on mount
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const login = useCallback(async (password: string) => {
    // This is a mock login. In a real app, you would verify against a backend.
    if (password === FAKE_USER.password) {
      localStorage.setItem('user', JSON.stringify(FAKE_USER));
      setUser(FAKE_USER);
    } else {
      throw new Error('Invalid password');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  // Mock user management functions
  const addUser = async (newUser: Omit<User, 'id'>) => { console.log('User added:', newUser); };
  const updateUser = async (id: string, updates: Partial<User>) => { console.log('User updated:', id, updates); };
  const getUsers = async () => [FAKE_USER];
  
  const value = {
    isAuthenticated: !!user,
    user,
    login,
    logout,
    addUser,
    updateUser,
    getUsers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
