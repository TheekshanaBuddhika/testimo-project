//  M.Theekshana Buddhika - 25021196
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

/**
 * hooks/useAuth.ts
 * ----------------
 * Reads the NextAuth session from /api/auth/session.
 * Returns the authenticated user object or null while loading.
 */

interface AuthUser {
  id:    string;
  name:  string;
  email: string;
  image: string;
}

interface UseAuthReturn {
  user: AuthUser | null;
  loading: boolean;
}

export function useAuth(): UseAuthReturn & { logout: () => Promise<void> } {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSession()
      .then((data) => {
        if (data && data.user && data.user.id) {
          setUser(data.user as AuthUser);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    // Get CSRF token first
    const { csrfToken } = await api.getCsrfToken();
    
    // Perform signout with CSRF token
    await fetch('/api/auth/signout', { 
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        csrfToken,
        json: 'true'
      })
    });
    
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, logout };
}
