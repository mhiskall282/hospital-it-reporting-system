import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { profileService, initializeSampleData } from '../services/firebaseService';
import toast from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  department?: string;
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        await fetchUserProfile(user);
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const fetchUserProfile = async (user: User) => {
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      
      if (profileSnap.exists()) {
        const profileData = profileSnap.data();
        setProfile({
          id: user.uid,
          email: user.email || '',
          fullName: profileData.fullName || user.displayName || '',
          role: profileData.role || (user.email === 'mhiskall123@gmail.com' ? 'admin' : 'user'),
          department: profileData.department,
          createdAt: profileData.createdAt
        });
      } else {
        // Create new profile for first-time users
        const isAdmin = user.email === 'mhiskall123@gmail.com';
        const newProfile = {
          fullName: user.displayName || user.email?.split('@')[0] || 'User',
          role: isAdmin ? 'admin' as const : 'user' as const,
          department: 'General',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        await setDoc(profileRef, newProfile);
        
        setProfile({
          id: user.uid,
          email: user.email || '',
          ...newProfile
        });

        // Initialize sample data for new users
        await initializeSampleData(user.uid);
        toast.success(isAdmin ? 'Welcome Admin! Sample data has been created.' : 'Welcome! Sample data has been created for you.');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load user profile');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update user profile
      await updateProfile(user, { displayName: fullName });
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'profiles', user.uid), {
        fullName,
        role: 'user',
        department: 'General',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      toast.success(`Welcome ${result.user.displayName}!`);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      toast.error(error.message || 'Failed to sign in with Google');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setProfile(null);
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    isAdmin: profile?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};