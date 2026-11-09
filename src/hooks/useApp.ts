import { useEffect } from 'react';
import { useQRStore } from '../store';
import { supabase } from '../lib/supabase';

/**
 * Syncs Supabase auth session → app store user state.
 * Call once at the top of the app.
 */
export function useAuthSync() {
  const { setUser, syncFromCloud, loadAllQR } = useQRStore();

  useEffect(() => {
    if (!supabase) return;

    // Get initial session
    supabase.auth.getSession().then(({ data }: { data: { session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null } }) => {
      const session = data.session;
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.['full_name'] ?? '',
          avatarUrl: session.user.user_metadata?.['avatar_url'],
        });
        syncFromCloud();
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.['full_name'] ?? '',
          avatarUrl: session.user.user_metadata?.['avatar_url'],
        });
        syncFromCloud();
      } else {
        setUser(null);
        loadAllQR();
      }
    });

    return () => subscription.unsubscribe();
  }, []);
}

/**
 * Applies the theme class to the document root.
 */
export function useThemeSync() {
  const { theme } = useQRStore();

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', shouldBeDark);
  }, [theme]);
}
