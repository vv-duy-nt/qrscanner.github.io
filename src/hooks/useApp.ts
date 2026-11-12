import { useEffect } from 'react';
import { useQRStore } from '../store';
import { supabase } from '../lib/supabase';

/**
 * Syncs Supabase auth session → app store user state.
 * Call once at the top of the app.
 */
export function useAuthSync() {
  useEffect(() => {
    if (!supabase) return;
    let activeUserId: string | null = null;

    const syncAfterLogin = () => {
      const store = useQRStore.getState();
      store.syncFromCloud().then(() => useQRStore.getState().syncToCloud()).catch(console.error);
    };

    const applySession = (session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null) => {
      const store = useQRStore.getState();
      if (session?.user) {
        if (activeUserId === session.user.id) return;
        activeUserId = session.user.id;
        store.setUser({
          id: session.user.id,
          email: session.user.email ?? '',
          name: session.user.user_metadata?.['full_name'] ?? '',
          avatarUrl: session.user.user_metadata?.['avatar_url'],
        });
        syncAfterLogin();
      } else {
        activeUserId = null;
        store.setUser(null);
        store.loadAllQR();
      }
    };

    // Get initial session
    supabase.auth.getSession().then(({ data }: { data: { session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null } }) => {
      applySession(data.session);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: unknown, session: { user: { id: string; email?: string; user_metadata?: Record<string, string> } } | null) => {
      applySession(session);
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
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const shouldBeDark = theme === 'dark' || (theme === 'system' && media.matches);
      root.classList.toggle('dark', shouldBeDark);
      root.style.colorScheme = shouldBeDark ? 'dark' : 'light';
    };

    applyTheme();
    if (theme === 'system') media.addEventListener('change', applyTheme);

    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);
}
