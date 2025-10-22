import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

// ---------------------------
// Quick setup notes (put in README or env):
// 1) Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.
// 2) In Supabase > Authentication > Providers, enable Google and add your redirect URL(s).
// 3) This component expects Tailwind CSS to be available in the project.
// ---------------------------

type Props = {
  /** Optional redirect URL after sign-in. If not provided, defaults to window.location.origin */
  redirectTo?: string;
  /** Optional className to style button wrapper */
  className?: string;
};

export default function SignUpWithGoogle({ redirectTo, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      // Supabase v2 method for OAuth sign-in
      const {
        data,
        error: signInError
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // request basic scopes; extend if you need additional Google scopes
          scopes: 'openid profile email',
          redirectTo: redirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined)
        }
      });

      if (signInError) throw signInError;

      // For OAuth redirect flows, supabase will redirect automatically. However
      // when using a popup (if Supabase supports that in your environment) data.url
      // might contain the redirect URL. You can optionally handle that here.
      // We'll just set loading false and rely on the redirect.
      setLoading(false);

      // If you want to inspect the returned URL (in non-redirect flows):
      // console.log('oauth url', data?.url);
    } catch (err: any) {
      console.error('Google sign-in failed', err);
      setError(err?.message || 'Sign in failed');
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleSignIn}
        disabled={loading}
        aria-disabled={loading}
        aria-label="Sign up with Google"
        className={`inline-flex items-center justify-center gap-3 px-4 py-2 rounded-md shadow-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition ${
          loading ? 'opacity-70 cursor-wait' : 'hover:shadow-md'
        }`}
      >
        {/* Google SVG mark (kept inline to avoid extra deps) */}
        <svg width="18" height="18" viewBox="0 0 533.5 544.3" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M533.5 278.4c0-18-1.6-35.4-4.6-52.4H272v99.1h146.9c-6.3 34-25.2 62.8-53.8 82.1v68h86.9c50.8-46.8 81.5-116 81.5-196.8z" fill="#4285F4"/>
          <path d="M272 544.3c72.6 0 133.6-24.1 178.1-65.5l-86.9-68c-24.2 16.2-55.2 25.8-91.2 25.8-69.9 0-129.2-47.2-150.4-110.5H33.6v69.6c44.3 88.1 136.6 148.6 238.4 148.6z" fill="#34A853"/>
          <path d="M121.6 322.3c-10.7-32-10.7-66.8 0-98.8V153.9H33.6c-44.4 88.1-44.4 192.6 0 280.7l88-69.6z" fill="#FBBC05"/>
          <path d="M272 107.7c38.5-.6 75.6 14 103.7 40.9l77.9-77.9C403.1 25.3 344.1 0 272 0 169.2 0 77 60.6 33.6 148.7l88 69.6C142.9 155 202.1 107.7 272 107.7z" fill="#EA4335"/>
        </svg>

        <span>{loading ? 'Redirecting...' : 'Sign up with Google'}</span>
      </button>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/*
  Usage examples:

  1) If you have a central supabase client file, remove the inline createClient usage
     and import your client instead:
       import { supabase } from '../lib/supabaseClient';

  2) Place the component in your sign-up page:
       <SignUpWithGoogle redirectTo={`${window.location.origin}/welcome`} />

  3) Supabase redirect callback: configure a route (e.g. /auth/callback) to read the
     URL parameters (access_token, refresh_token, provider_token, etc.) if you
     need to perform additional logic on redirect.

  Notes & troubleshooting:
  - Make sure Google provider is enabled in Supabase and that authorized redirect
    URIs include the URL you provide in redirectTo (or your site origin).
  - For local development, add http://localhost:3000 (or your dev port) to the
    provider's redirect URIs in Supabase.
*/
