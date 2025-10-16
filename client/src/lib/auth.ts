// example: src/lib/auth.ts (or inside the component file)
import { supabase } from '@/lib/supabase';

export async function signInWithProvider(provider: 'google') {
  try {
    const redirectTo = window.location.origin + '/account'; // where to land after OAuth
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      console.error('OAuth sign-in error', error);
      throw error;
    }

    // In many environments data.url will be provided; navigate there explicitly.
    // Some browsers / setups auto-redirect — this is a safe fallback.
    if (data?.url) {
      window.location.href = data.url;
    }
  } catch (err: any) {
    // handle/show error to the user in UI
    alert(err?.message ?? 'Sign-in failed');
  }
}
