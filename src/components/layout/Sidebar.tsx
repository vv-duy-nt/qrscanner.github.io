import React from 'react';
import { QrCode, Library, Settings, Cloud, CloudOff, RefreshCw, LogIn, LogOut, Moon, Sun, Monitor } from 'lucide-react';
import { useQRStore } from '../../store';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { isSupabaseConfigured } from '../../lib/supabase';

export function Sidebar() {
  const { view, setView, theme, setTheme, user, loginWithGoogle, logout, isSyncing, syncFromCloud } = useQRStore();

  const navItems = [
    { id: 'editor' as const, icon: QrCode, label: 'Tạo mã QR' },
    { id: 'library' as const, icon: Library, label: 'Thư viện' },
    { id: 'settings' as const, icon: Settings, label: 'Cài đặt' },
  ];

  const themeIcons = {
    light: <Sun className="h-4 w-4" />,
    dark: <Moon className="h-4 w-4" />,
    system: <Monitor className="h-4 w-4" />,
  };

  const nextTheme = { light: 'dark', dark: 'system', system: 'light' } as const;

  return (
    <aside className="flex flex-col h-full w-16 md:w-60 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 py-5 px-3 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-1 mb-8">
        <div className="h-8 w-8 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
          <QrCode className="h-[18px] w-[18px] text-white dark:text-zinc-950" />
        </div>
        <div className="hidden md:block leading-tight">
          <span className="block font-semibold text-zinc-900 dark:text-white text-sm tracking-tight">QR Studio</span>
          <span className="block text-[10px] uppercase tracking-[0.14em] text-zinc-400 mt-0.5">Workspace</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={cn(
              'relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-sm transition-colors',
              view === id
                ? 'bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white font-medium shadow-[inset_0_0_0_1px_rgb(228_228_231)] dark:shadow-[inset_0_0_0_1px_rgb(39_39_42)]'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            )}
          >
            {view === id && <span className="absolute left-0 h-4 w-0.5 rounded-full bg-blue-600" />}
            <Icon className="h-[18px] w-[18px] shrink-0" />
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
