import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, setUserProfile } from '../firebase/db';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Primary admin email from environment/metadata
const SUPER_ADMIN_EMAIL = 'rajatb419@gmail.com';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfileState] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          let profile = await getUserProfile(currentUser.uid);
          const isSuperAdmin = currentUser.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

          if (!profile) {
            profile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              role: isSuperAdmin ? 'admin' : 'viewer',
              createdAt: new Date().toISOString(),
            };
            await setUserProfile(profile);
          } else if (isSuperAdmin && profile.role !== 'admin') {
            profile.role = 'admin';
            await setUserProfile(profile);
          }
          setUserProfileState(profile);
        } catch (err: any) {
          console.error('Error synchronizing user profile:', err);
        }
      } else {
        setUserProfileState(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      throw err;
    }
  };

  const signUp = async (email: string, pass: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const isSuperAdmin = email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        role: isSuperAdmin ? 'admin' : 'viewer',
        createdAt: new Date().toISOString(),
      };
      await setUserProfile(profile);
      setUserProfileState(profile);
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const isSuperAdmin = cred.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        profile = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          role: isSuperAdmin ? 'admin' : 'viewer',
          createdAt: new Date().toISOString(),
        };
        await setUserProfile(profile);
      } else if (isSuperAdmin && profile.role !== 'admin') {
        profile.role = 'admin';
        await setUserProfile(profile);
      }
      setUserProfileState(profile);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfileState(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  const isAdmin = Boolean(
    (user && user.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) ||
    userProfile?.role === 'admin'
  );

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
        logout,
        error,
        clearError: () => setError(null)
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
