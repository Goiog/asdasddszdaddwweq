import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/navigation';
import { useQuery } from "@tanstack/react-query";
import { supabase } from '@/lib/supabase';
import { useAuth } from "@/hooks/useAuth";
import {
  getUserUnlockedCards,
  allCards,
  ChineseWord
} from "@/lib/card-utils";


export default function Account(): JSX.Element {
  const { session } = useAuth();           // use the same session from hook
  const { user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const {
    data: allWords = [],
    isLoading: isAllWordsLoading,
  } = useQuery<ChineseWord[]>({
    queryKey: ["words"],
    queryFn: allCards,
    staleTime: 1000 * 60 * 5,
  });


  // Deduplicate local collection
  const {
    data: uniqueCards = [],
    isLoading: isCollectionLoading,
    refetch: refetchCollection,
  } = useQuery<ChineseWord[]>({
    queryKey: ["userUnlockedCards"],
    queryFn: getUserUnlockedCards,
    staleTime: 1000 * 60 * 5, // cache 5 minutes
  });

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading account…</div>; // navigate already handled

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: fullName },
      });

      if (error) {
        setMessage(error.message);
      } else {
        // optional: refresh the auth context if your AuthProvider exposes a refresh
        if (typeof refreshSession === "function") {
          await refreshSession();
        }

        setEditingName(false);
        setMessage("Profile updated");
      }
    } catch (err: any) {
      setMessage(err?.message ?? "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  

  const initials = (fullName || user.email || '')
    .split(/\s+/)
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);

  // normalizeRowToChineseWord(...) unchanged (kept as in your original file)
  
  



  return (
    <div className="min-h-screen bg-background">
      <Navigation cardCount={uniqueCards.length} totalCards={allWords.length} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto grid gap-6">
          <section className="bg-white p-6 rounded-2xl border border-border shadow">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-2xl font-semibold">
                {initials}
              </div>

              <div className="flex-1">
                <h1 className="text-xl font-semibold">Account</h1>
                <p className="text-sm text-slate-500">Manage your profile and sign out of this device.</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="text-sm">{user.email}</div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      emailVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {emailVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={handleLogout}
                  className="py-2 px-4 rounded bg-red-600 text-white hover:opacity-95"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border shadow">
            <h2 className="text-lg font-medium">Profile</h2>
            <p className="text-sm text-slate-500 mb-4">Update information that will be visible to other users.</p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm">Full name</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 border p-2 rounded"
                    placeholder="Your full name"
                  />

                  <button
                    type="button"
                    onClick={() => setEditingName((s) => !s)}
                    className="py-2 px-3 rounded border"
                  >
                    {editingName ? 'Cancel' : 'Edit'}
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="py-2 px-4 rounded bg-blue-600 text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">This updates your <code>user_metadata.full_name</code>.</p>
              </div>

              <div>
                <label className="block text-sm">Email</label>
                <div className="mt-2 flex items-center gap-3">
                  <input value={user.email} readOnly className="flex-1 border p-2 rounded bg-slate-50" />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(user.email)}
                    className="py-2 px-3 rounded border"
                  >
                    Copy
                  </button>
                </div>
                {!emailVerified && (
                  <p className="text-xs text-amber-600 mt-2">Your email is not verified. Check your inbox or sign out and sign in again to re-trigger verification flows.</p>
                )}
              </div>

              {message && <p className="text-sm text-red-600">{message}</p>}
            </form>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-border shadow">
            <h2 className="text-lg font-medium">Danger zone</h2>
            <p className="text-sm text-slate-500 mb-4">Actions that affect your account access.</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleLogout}
                className="flex-1 py-2 rounded border"
              >
                Sign out everywhere
              </button>

              <button
                onClick={() => alert('To delete your account, contact support or implement a server endpoint that calls the Admin API. Deleting users from the browser is not allowed by Supabase client SDK for safety.')}
                className="flex-1 py-2 rounded bg-red-600 text-white"
              >
                Delete account
              </button>
            </div>
          </section>

          <section className="bg-white p-4 rounded-2xl border border-border shadow">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Raw session / user object</div>
              <button onClick={() => setShowRaw((s) => !s)} className="text-sm underline">
                {showRaw ? 'Hide' : 'Show'}
              </button>
            </div>

            {showRaw && (
              <pre className="mt-3 max-h-60 overflow-auto text-xs bg-slate-50 p-3 rounded">{JSON.stringify(user, null, 2)}</pre>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
