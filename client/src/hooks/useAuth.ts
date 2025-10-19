// src/hooks/useAuth.ts
import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

/**
 * useAuth
 * - session: full Supabase Session | null | undefined (undefined while initial check)
 * - user: convenience for session?.user
 * - isLoading: true while initial session check is in progress (session === undefined)
 * - refreshSession: manual refresh helper that forces a new session fetch
 */
export function useAuth() {
  // undefined = still loading initial check
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const refreshSession = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data?.session ?? null);
      return data?.session ?? null;
    } catch (err) {
      // keep previous session if refresh failed; swallow error here
      console.error("Failed to refresh session", err);
      return null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data?.session ?? null);
    }).catch((err) => {
      console.error("Error getting initial session", err);
      if (mounted) setSession(null);
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
        (listener as any)?.subscription?.unsubscribe?.();
      } catch {
        try {
          (listener as any)?.unsubscribe?.();
        } catch {
          // ignore if neither exists
        }
      }
    };
  }, [refreshSession]);

  return {
    session: session as Session | null | undefined,
    user: (session as Session | null | undefined)?.user as User | null | undefined,
    isLoading: session === undefined,
    refreshSession,
  };
}
