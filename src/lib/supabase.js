// ═══════════════════════════════════════════════════════════════════════════
// Supabase Client — REST-based (no SDK dependency)
// ═══════════════════════════════════════════════════════════════════════════

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️ Supabase credentials missing — check your .env file');
}

// ── Auth helpers ─────────────────────────────────────────────────────────

export const supabaseAuth = {
  signIn: async (email, password) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: data.error_description || data.msg || 'Login failed' };
      return { data, error: null };
    } catch (e) {
      console.error('Auth error:', e);
      const isMissing = !SUPABASE_URL || SUPABASE_URL === 'undefined';
      return { 
        data: null, 
        error: isMissing 
          ? 'Supabase URL is missing or "undefined" in Vercel settings.' 
          : `Network error: could not reach ${SUPABASE_URL}`
      };
    }
  },

  signOut: async (token) => {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, Authorization: `Bearer ${token}` },
      });
    } catch {
      // Ignore logout errors
    }
  },

  getUser: async (token) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { 'apikey': SUPABASE_KEY, Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  recover: async (email) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) return { error: 'Failed to send reset email' };
      return { error: null };
    } catch (e) {
      const isMissing = !SUPABASE_URL || SUPABASE_URL === 'undefined';
      return { 
        error: isMissing 
          ? 'Supabase URL missing — check Vercel settings' 
          : 'Network error — could not reach auth server' 
      };
    }
  },

  signUp: async (email, password) => {
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { data: null, error: data.error_description || data.msg || 'Sign up failed' };
      return { data, error: null };
    } catch (e) {
      const isMissing = !SUPABASE_URL || SUPABASE_URL === 'undefined';
      return { 
        data: null, 
        error: isMissing 
          ? 'Supabase URL missing — check Vercel settings' 
          : 'Network error — could not reach auth server' 
      };
    }
  },

  signInWithProvider: (provider) => {
    if (!SUPABASE_URL) {
      console.error('Supabase URL missing — cannot redirect');
      return { error: 'Supabase configuration missing' };
    }
    const redirectUrl = `${window.location.origin}`;
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectUrl)}`;
  },
};

// ── Minimal REST client ──────────────────────────────────────────────────

export const supabase = {
  from: (table) => ({
    select: () => ({
      then: async (resolve) => {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
          headers: { 'apikey': SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
        const data = res.ok ? await res.json() : [];
        resolve({ data, error: res.ok ? null : 'Error loading' });
      },
    }),
    upsert: (record) => ({
      select: () => ({
        then: async (resolve) => {
          await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              Prefer: 'return=representation,resolution=merge-duplicates',
            },
            body: JSON.stringify(record),
          });
          resolve({ data: [record], error: null });
        },
      }),
    }),
    delete: () => ({
      eq: (col, val) => ({
        then: async (resolve) => {
          await fetch(`${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}`, {
            method: 'DELETE',
            headers: { 'apikey': SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
          });
          resolve({ error: null });
        },
      }),
    }),
  }),
};
