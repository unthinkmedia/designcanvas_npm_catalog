import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

const EMU_SUFFIX = '_microsoft';

function isEmuUser(user: User): boolean {
  const username: string | undefined = user.user_metadata?.user_name;
  return typeof username === 'string' && username.endsWith(EMU_SUFFIX);
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user && !isEmuUser(s.user)) {
        await supabase.auth.signOut();
        setSession(null);
        setAuthError('Access restricted to Microsoft EMU GitHub accounts.');
      } else {
        setSession(s);
        setAuthError(null);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (s?.user && !isEmuUser(s.user)) {
        await supabase.auth.signOut();
        setSession(null);
        setAuthError('Access restricted to Microsoft EMU GitHub accounts.');
      } else {
        setSession(s);
        setAuthError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async () => {
    setAuthError(null);
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthError(null);
  }, []);

  const user: User | null = session?.user ?? null;

  return { session, user, loading, signIn, signOut, authError };
}
