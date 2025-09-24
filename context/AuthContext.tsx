import React, { createContext, useState, useEffect, useContext } from 'react';
import type { User } from '@/types';
import { db } from '@/services/db';
import { useLiveQuery } from 'dexie-react-hooks';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  addUser: (username: string, password: string, companyName: string, companyAddress: string, companyPhone: string, companyICE: string, companySubtitle: string) => Promise<boolean>;
  removeUser: (id: string) => Promise<void>;
  updateUser: (userId: string, data: Partial<Omit<User, 'id'>>) => Promise<{ success: boolean; message: string }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const users = useLiveQuery(() => db.users.toArray());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
        setIsLoading(true);
        try {
            const currentUserId = localStorage.getItem('currentUserId');
            if (currentUserId) {
                const user = await db.users.get(currentUserId);
                setCurrentUser(user || null);
            }
        } catch (error) {
            console.error("Failed to check session:", error);
        } finally {
            setIsLoading(false);
        }
    };
    checkSession();
  }, []);


  const login = async (password: string): Promise<boolean> => {
    const user = await db.users.where({ password }).first();
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('currentUserId', user.id);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserId');
  };

  const addUser = async (username: string, password: string, companyName: string, companyAddress: string, companyPhone: string, companyICE: string, companySubtitle: string): Promise<boolean> => {
    try {
        const existingUser = await db.users.where({ username }).first();
        if (existingUser) {
            alert(`User ${username} already exists.`);
            return false;
        }
        const newUser: User = { id: `${Date.now()}`, username, password, companyName, companyAddress, companyPhone, companyICE, companySubtitle };
        await db.users.add(newUser);
        return true;
    } catch (error) {
        console.error("Failed to add user:", error);
        return false;
    }
  };

  const removeUser = async (id: string) => {
    if (currentUser?.id === id) {
        alert("Cannot delete the currently logged-in user.");
        return;
    }
    await db.users.delete(id);
  };

  const updateUser = async (userId: string, data: Partial<Omit<User, 'id'>>): Promise<{ success: boolean; message: string }> => {
     try {
        const userToUpdate = await db.users.get(userId);
        if (!userToUpdate) {
            return { success: false, message: 'User not found.' };
        }

        if (data.username && data.username !== userToUpdate.username) {
            const existingUser = await db.users.where('username').equals(data.username).first();
            if (existingUser && existingUser.id !== userId) {
                return { success: false, message: 'usernameTakenError' };
            }
        }

        await db.users.update(userId, data);

        if (currentUser?.id === userId) {
            const updatedUser = await db.users.get(userId);
            setCurrentUser(updatedUser || null);
        }

        return { success: true, message: 'profileUpdateSuccess' };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, message: 'An unexpected error occurred.' };
    }
  };
  
  if (isLoading) {
    return null; 
  }

  return (
    <AuthContext.Provider value={{ currentUser, users: users || [], login, logout, addUser, removeUser, updateUser }}>
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