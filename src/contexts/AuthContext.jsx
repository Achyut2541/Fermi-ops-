import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseAuth } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authToken, setAuthToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);   // null until resolved from email
  const [authEmail, setAuthEmail] = useState(null);        // FIX P0-1: track auth email

  useEffect(() => {
    const restore = async () => {
      // 1. Check for OAuth callback hash first
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const hashToken = params.get('access_token');
      
      if (hashToken) {
        try {
          const user = await supabaseAuth.getUser(hashToken);
          if (user?.email) {
            setAuthToken(hashToken);
            setAuthEmail(user.email);
            setIsLoggedIn(true);
            localStorage.setItem('sk_auth_token', hashToken);
            localStorage.setItem('sk_auth_email', user.email);
            // Clean URL hash but keep history clean
            window.history.replaceState(null, null, window.location.pathname);
            setAuthChecked(true);
            return;
          }
        } catch (e) {
          console.error('OAuth restore failed:', e);
        }
      }

      // 2. Fallback to LocalStorage
      const token = localStorage.getItem('sk_auth_token');
      const email = localStorage.getItem('sk_auth_email');
      if (token && email) {
        try {
          const user = await supabaseAuth.getUser(token);
          if (user?.email) {
            setAuthToken(token);
            setAuthEmail(email);   // FIX P0-1: store email so DataContext can resolve name
            setIsLoggedIn(true);
          } else {
            localStorage.removeItem('sk_auth_token');
            localStorage.removeItem('sk_auth_email');
          }
        } catch {
          /* stay logged out */
        }
      }
      setAuthChecked(true);
    };
    restore();
  }, []);

  const loginWithProvider = useCallback((provider) => {
    supabaseAuth.signInWithProvider(provider);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabaseAuth.signIn(email, password);
    if (error) return { error };
    setAuthToken(data.access_token);
    setAuthEmail(email);           // FIX P0-1: set email so DataContext resolves the name
    setIsLoggedIn(true);
    localStorage.setItem('sk_auth_token', data.access_token);
    localStorage.setItem('sk_auth_email', email);
    return { error: null };
  }, []);

  const signup = useCallback(async (email, password) => {
    const { data, error } = await supabaseAuth.signUp(email, password);
    if (error) return { error };
    if (data?.access_token) {
      setAuthToken(data.access_token);
      setAuthEmail(email);           // FIX P0-1: set email so DataContext resolves the name after auto-confirm signup
      setIsLoggedIn(true);
      localStorage.setItem('sk_auth_token', data.access_token);
      localStorage.setItem('sk_auth_email', email);
    }
    return { error: null, needsConfirmation: !data?.access_token };
  }, []);

  const resetPassword = useCallback(async (email) => {
    const { error } = await supabaseAuth.recover(email);
    if (error) return { error };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    if (authToken) await supabaseAuth.signOut(authToken);
    setAuthToken(null);
    setAuthEmail(null);            // FIX P0-1: clear email on logout
    setIsLoggedIn(false);
    setCurrentUser(null);          // FIX P0-1: null, not hardcoded 'Achyut'
    localStorage.removeItem('sk_auth_token');
    localStorage.removeItem('sk_auth_email');
  }, [authToken]);

  return (
    <AuthContext.Provider value={{
      authToken, isLoggedIn, authChecked,
      currentUser, setCurrentUser,
      authEmail,                   // FIX P0-1: expose so DataContext can resolve name
      login, signup, logout, resetPassword, loginWithProvider,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
