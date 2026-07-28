import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const PROFILE_KEY = 'sk_profile_email';

// No passwords / no Supabase auth. Identity is chosen from a name picker and
// remembered per browser. authEmail is the identity key; DataContext resolves
// currentUser (the person's name + role) from it against the team roster.
export function AuthProvider({ children }) {
  const [authEmail, setAuthEmail] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);  // resolved by DataContext
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) setAuthEmail(saved);
    setAuthChecked(true);
  }, []);

  const selectProfile = useCallback((email) => {
    setCurrentUser(null);          // force re-resolution against the new identity
    setAuthEmail(email);
    localStorage.setItem(PROFILE_KEY, email);
  }, []);

  const logout = useCallback(() => {
    setAuthEmail(null);
    setCurrentUser(null);
    localStorage.removeItem(PROFILE_KEY);
  }, []);

  const isLoggedIn = !!authEmail;

  return (
    <AuthContext.Provider value={{
      authChecked, isLoggedIn, authEmail,
      currentUser, setCurrentUser,
      selectProfile, logout,
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
