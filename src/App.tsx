/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { AuthForm } from './components/AuthForm';
import { 
  LogOut, 
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

class ErrorBoundary extends React.Component<any, any> {
  state = { hasError: false, error: null };

  constructor(props: { children: React.ReactNode }) {
    super(props);
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "{}");
        if (parsed.error) errorMessage = parsed.error;
      } catch {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Error</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}


const UserDashboard = ({ user }: any) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.uid]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
    >
      <div className="p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <img 
              src={profile?.photoURL || user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} 
              alt="Profile" 
              className="w-24 h-24 rounded-full border-4 border-indigo-50 shadow-lg object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 right-0 bg-green-500 border-2 border-white w-6 h-6 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">{profile?.displayName || user.displayName || 'User'}</h2>
          <p className="text-gray-500">{user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="p-4 bg-indigo-50 rounded-2xl">
            <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">User ID</p>
            <p className="text-sm font-mono text-indigo-900 truncate">{user.uid}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-2xl">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Status</p>
            <div className="flex items-center gap-2 text-green-900">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">Authenticated</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut(auth)}
          className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 font-sans">
        <AnimatePresence mode="wait">
          {!user ? (
            <AuthForm key="auth" />
          ) : (
            <UserDashboard key="dashboard" user={user} />
          )}
        </AnimatePresence>
        
        <footer className="mt-8 text-gray-400 text-sm">
          Secure Auth Portal &bull; Powered by Firebase
        </footer>
      </div>
    </ErrorBoundary>
  );
}
