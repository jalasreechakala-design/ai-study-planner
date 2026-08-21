import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

async function getAuthUserData(firebaseUser) {
  if (!firebaseUser) return null;
  if (!db) return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
    email: firebaseUser.email || '',
    role: 'student',
    status: 'active',
    profile: {}
  };

  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);
  const profileDoc = userSnap.exists() ? userSnap.data() : null;

  return {
    id: profileDoc?.id || firebaseUser.uid,
    uid: firebaseUser.uid,
    name: profileDoc?.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Student',
    email: profileDoc?.email || firebaseUser.email || '',
    role: profileDoc?.role || 'student',
    status: profileDoc?.status || 'active',
    profile: profileDoc?.profile || {}
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [platformMode, setPlatformMode] = useState(localStorage.getItem('platformMode') || 'college');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setUser(null);
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser ? await getAuthUserData(firebaseUser) : null);
      } catch (error) {
        console.error('Firebase Auth State Error:', {
          code: error.code,
          message: error.message,
          error
        });
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      if (!auth) {
        throw {
          code: 'auth/configuration-not-initialized',
          message: 'Firebase is not configured. Add your VITE_FIREBASE_* values to the frontend .env file.'
        };
      }

      const result = await signInWithEmailAndPassword(auth, email, password);
      const appUser = await getAuthUserData(result.user);

      if (appUser && (appUser.status === 'inactive' || appUser.status === 'disabled' || appUser.status === 'blocked')) {
        await signOut(auth);
        throw {
          code: 'auth/account-disabled',
          message: 'Your account is currently inactive or suspended. Please contact administrator.'
        };
      }

      setUser(appUser);
      return appUser;
    } catch (error) {
      console.error('Firebase Login Error:', {
        code: error.code,
        message: error.message,
        error
      });
      throw error;
    }
  };

  const register = async (studentData) => {
    try {
      if (!auth || !db) {
        throw {
          code: 'auth/configuration-not-initialized',
          message: 'Firebase is not configured. Add your VITE_FIREBASE_* values to the frontend .env file.'
        };
      }

      const { name, email, password, phone, college, course, branch, year_of_study } = studentData;
      const result = await createUserWithEmailAndPassword(auth, email, password);

      const profile = {
        phone: phone || '',
        college: college || '',
        course: course || '',
        branch: branch || '',
        year_of_study: year_of_study || ''
      };

      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        id: result.user.uid,
        name,
        email,
        role: 'student',
        status: 'active',
        profile,
        createdAt: serverTimestamp()
      });

      const appUser = await getAuthUserData(result.user);
      setUser(appUser);
      return appUser;
    } catch (error) {
      console.error('Firebase Registration Error:', {
        code: error.code,
        message: error.message,
        error
      });
      throw error;
    }
  };

  const logout = async () => {
    if (!auth) {
      setUser(null);
      return;
    }

    await signOut(auth);
    setUser(null);
  };

  const switchPlatform = (mode) => {
    setPlatformMode(mode);
    localStorage.setItem('platformMode', mode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        platformMode,
        login,
        register,
        logout,
        switchPlatform,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        token: user ? 'firebase-session' : null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
