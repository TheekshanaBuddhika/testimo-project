//  M.Theekshana Buddhika - 25021196
/**
 * pages/LoginPage.tsx
 * --------------------
 * Public landing + sign-in page.
 * Clicking "Sign in with Google" sends the user to the NextAuth
 * Google OAuth flow on the backend.
 */
import { useState } from 'react';
import './LoginPage.css';
import logo from '../assets/testimo.png';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || '';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Auth.js (NextAuth v5) strictly requires POST requests with a CSRF token for sign in
      const res = await fetch(`${BACKEND_URL}/api/auth/csrf`, { credentials: 'include' });
      const { csrfToken } = await res.json();

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = `${BACKEND_URL}/api/auth/signin/google`;

      const csrfInput = document.createElement('input');
      csrfInput.type = 'hidden';
      csrfInput.name = 'csrfToken';
      csrfInput.value = csrfToken;
      form.appendChild(csrfInput);

      const callbackInput = document.createElement('input');
      callbackInput.type = 'hidden';
      callbackInput.name = 'callbackUrl';
      callbackInput.value = window.location.origin + '/';
      form.appendChild(callbackInput);

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error('Failed to initiate sign-in', error);
      setLoading(false);
    }
  };

  return (
    <div className="login-page" role="main">
      <div className="login-card">
        <div className="login-logo">
          <img src={logo} alt="Testimo Logo" className="login-logo-img" />
        </div>

        <h1 className="login-title">Welcome to Testimo</h1>
        <p className="login-subtitle">
          Collect, manage, and showcase customer testimonials — beautifully.
        </p>

        <button
          id="google-signin-btn"
          className="google-btn"
          onClick={handleGoogleSignIn}
          type="button"
          disabled={loading}
        >
          {loading ? (
            'Connecting...'
          ) : (
            <>
              <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p className="login-terms">
          By signing in, you agree to our{' '}
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="login-link">Terms of Service</a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="login-link">Privacy Policy</a>.
        </p>
      </div>

      {/* Background decorative orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />
    </div>
  );
}
