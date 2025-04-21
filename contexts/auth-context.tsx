"use client"

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { authState } from '@/lib/auth-state';

type AuthContextType = {
  user: User | null;
  userRole: string | null;
  isLoading: boolean;
  setUser: (user: User) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userRole: null,
  isLoading: true,
  setUser: () => {},
  signOut: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state
    const initializeAuth = async () => {
      try {
        // Set initial state from auth state manager
        const user = authState.getUser();
        const userRole = authState.getUserRole();

        if (user) {
          authState.setUser(user);
          if (userRole) {
            authState.setUserRole(userRole);
          }
        }

        // Set up auth state change listener
        const handleAuthStateChange = (event: StorageEvent) => {
          if (event.key === 'userId' && !event.newValue) {
            // User signed out
            authState.logout();
          }
        };

        window.addEventListener('storage', handleAuthStateChange);
        return () => window.removeEventListener('storage', handleAuthStateChange);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const setUser = (user: User) => {
    authState.setUser(user);
  };

  const signOut = async () => {
    try {
      authState.logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user: authState.getUser(),
    userRole: authState.getUserRole(),
    isLoading,
    setUser,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
