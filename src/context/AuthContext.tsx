import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AdminUser,
  getActiveAdminSession,
  saveAdminSession,
  destroyAdminSession,
  verifyAdminCredentials,
  setCustomAdminPassword,
  getAdminEmail
} from '../utils/adminAuth';
import { UserProfile } from '../types';

export interface AppUser {
  email: string;
  uid: string;
}

interface AuthContextType {
  user: AppUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateAdminPassword: (newPass: string) => void;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const active = getActiveAdminSession();
      setSession(active);
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    const verification = verifyAdminCredentials(email, pass);
    if (!verification.success) {
      const msg = verification.message || 'Invalid admin credentials';
      setError(msg);
      throw new Error(msg);
    }
    const newSession = saveAdminSession();
    setSession(newSession);
  };

  const signUp = async (email: string, pass: string) => {
    return signIn(email, pass);
  };

  const signInWithGoogle = async () => {
    const newSession = saveAdminSession();
    setSession(newSession);
  };

  const resetPassword = async (_email: string) => {
    setCustomAdminPassword('rajat123');
  };

  const updateAdminPassword = (newPass: string) => {
    setCustomAdminPassword(newPass);
  };

  const logout = async () => {
    destroyAdminSession();
    setSession(null);
  };

  const isAdmin = Boolean(session && session.role === 'admin');

  const user: AppUser | null = session
    ? { email: session.email, uid: 'admin_master_uid' }
    : null;

  const userProfile: UserProfile | null = session
    ? {
        uid: 'admin_master_uid',
        email: session.email,
        role: 'admin',
        createdAt: session.authenticatedAt,
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        resetPassword,
        updateAdminPassword,
        logout,
        error,
        clearError: () => setError(null),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
