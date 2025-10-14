import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  // If a user is already logged in, redirect away from login page
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted && data.session) {
        navigate('/');
      }
    })();
    return () => { mounted = false; };
  }, [navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else {
      setMessage('Signed in successfully');
      // You can inspect data.session or data.user; redirect to protected route
      navigate('/');
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setMessage(error.message);
    else setMessage('Sign-up successful — check your email for a confirmation (if enabled)');
  }

  async function signInWithProvider(provider: 'github' | 'google' | 'gitlab') {
    // This will redirect the browser to the provider's consent screen
    const { data, error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) setMessage(error.message);
    // For the redirect flow, Supabase handles the redirect.
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-semibold mb-4">Log in / Sign up</h1>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <label className="block text-sm">Email</label>
            <input
              className="w-full border p-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm">Password</label>
            <input
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="py-2 px-4 rounded border"
            >
              Sign up
            </button>
          </div>
        </form>

        <div className="my-4 text-center">or</div>

        <div className="space-y-2">
          <button onClick={() => signInWithProvider('github')} className="w-full py-2 rounded border">
            Continue with GitHub
          </button>
          <button onClick={() => signInWithProvider('google')} className="w-full py-2 rounded border">
            Continue with Google
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-red-600">{message}</p>}

      </div>
    </div>
  );
}