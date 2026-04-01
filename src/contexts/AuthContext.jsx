import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabaseAuth } from '../lib/supabase';

// Parse Supabase OAuth redirect hash (access_token=...&refresh_token=...&...)
function parseOAuthHash() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token=')) return null;
  const params = new URLSearchParams(hash.slice(1));
  const token = params.get('access_token');
  return token || null;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authToken, setAuthToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);   // null until resolved from email
  const [authEmail, setAuthEmail] = useState(null);        // FIX P0-1: track auth email

  useEffect(() => {
    const restore = async () => {
      // ── Handle Google OAuth redirect (hash contains access_token) ──────────
      const oauthToken = parseOAuthHash();
      if (oauthToken) {
        try {
          const user = await supabaseAuth.getUser(oauthToken);
          if (user?.email) {
            setAuthToken(oauthToken);
            setAuthEmail(user.email);
            setIsLoggedIn(true);
            localStorage.setItem('sk_auth_token', oauthToken);
            localStorage.setItem('sk_auth_email', user.email);
            // Clean up URL so the token doesn't stay in the bar
            window.history.replaceState(null, '', window.location.pathname);
            setAuthChecked(true);
            return;
          }
        } catch {
          /* fall through to normal restore */
        }
      }

      // ── Normal session restore from localStorage ──────────────────────────
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
      setAuthEmail(email);           // resolve currentUser from team members immediately
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

  const loginWithGoogle = useCallback(() => {
    supabaseAuth.signInWithGoogle();
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
      login, signup, logout, resetPassword, loginWithGoogle,
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
