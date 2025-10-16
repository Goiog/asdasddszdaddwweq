// src/hooks/useAuth.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";

/**
 * useAuth
 * - Exposes the current session (Session | null).
 * - Exposes an isLoading flag while the initial session check completes.
 * - Subscribes to auth state changes and cleans up the subscription on unmount.
 */
export function useAuth() {
  // undefined = still loading initial check
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;

    // initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data?.session ?? null);
    });

    // subscribe to later auth state changes (login/logout, token refresh, etc.)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      // unsubscribe listener (v2 shape)
      // listener?.subscription?.unsubscribe?.() is defensive for different SDK shapes
      try {
        // preferred API (supabase-js v2)
        (listener as any)?.subscription?.unsubscribe?.();
      } catch {
        // fallback: some earlier SDKs return unsubscribe function directly
        try {
          (listener as any)?.unsubscribe?.();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  return {
    session: session as Session | null | undefined,
    isLoading: session === undefined,
  };
}
