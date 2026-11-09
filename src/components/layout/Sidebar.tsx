import React from 'react';
import { QrCode, Library, Settings, Cloud, CloudOff, RefreshCw, LogIn, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { useQRStore } from '../../store';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { isSupabaseConfigured } from '../../lib/supabase';

export function Sidebar() {
  const { view, setView, theme, setTheme, user, loginWithGoogle, logout, isSyncing, syncFromCloud } = useQRStore();

  const navItems = [
    { id: 'editor' as const, icon: QrCode, label: 'QR Editor' },
    { id: 'library' as const, icon: Library, label: 'My Library' },
    { id: 'settings' as const, icon: Settings, label: 'Cài đặt' },
  ];

  const themeIcons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const nextTheme = { light: 'dark', dark: 'system', system: 'light' } as const;

  return (
    <aside className="flex flex-col h-full w-16 md:w-56 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 py-4 px-2 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <QrCode className="h-5 w-5 text-white" />
        </div>
        <span className="hidden md:block font-bold text-zinc-900 dark:text-white text-sm tracking-tight">
          QR Studio
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-colors',
              view === id
                ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="hidden md:block">{label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom area */}
      <div className="flex flex-col gap-2 mt-4">
        {/* Cloud status */}
        {isSupabaseConfigured && (
          <div className="hidden md:flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            {user ? (
              <>
                <Cloud className="h-4 w-4 text-green-500 shrink-0" />
                <span className="text-xs text-zinc-500 flex-1 truncate">{user.name || user.email}</span>
                <button
                  onClick={syncFromCloud}
                  disabled={isSyncing}
                  title="Đồng bộ"
                  className="text-zinc-400 hover:text-indigo-600 transition-colors"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
                </button>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4 text-zinc-400 shrink-0" />
                <span className="text-xs text-zinc-500 flex-1">Local Mode</span>
              </>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="self-start"
          onClick={() => setTheme(nextTheme[theme])}
          title={`Theme: ${theme}`}
        >
          {themeIcons[theme]}
        </Button>

        {/* Auth button */}
        {isSupabaseConfigured && (
          user ? (
            <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden md:block">Đăng xuất</span>
            </Button>
          ) : (
            <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={loginWithGoogle}>
              <LogIn className="h-4 w-4" />
              <span className="hidden md:block">Đăng nhập</span>
            </Button>
          )
        )}
      </div>
    </aside>
  );
}
