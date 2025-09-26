// Fix: Provide a functional AuthContext implementation.
import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react';

// Fix: Define the shape of the authentication context.
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fix: Implement AuthProvider to manage and provide authentication state.
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);
  
  const value = useMemo(() => ({
    isAuthenticated,
    login,
    logout
  }), [isAuthenticated]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Fix: Create a custom hook for easy consumption of the AuthContext.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
