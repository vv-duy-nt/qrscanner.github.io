import React from 'react';
import { Moon, Sun, Monitor, LogIn, LogOut, Cloud, CloudOff, RefreshCw, Info, Shield, ExternalLink } from 'lucide-react';
import { useQRStore } from '../../store';
import { Button } from '../ui/Button';
import { Card, Switch, Divider } from '../ui/index';
import { isSupabaseConfigured } from '../../lib/supabase';

export function SettingsPage() {
  const { theme, setTheme, user, loginWithGoogle, logout, isSyncing, syncFromCloud, syncToCloud } = useQRStore();

  const themeOptions = [
    { value: 'light' as const, label: 'Sáng', icon: Sun },
    { value: 'dark' as const, label: 'Tối', icon: Moon },
    { value: 'system' as const, label: 'Hệ thống', icon: Monitor },
  ];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-white">Cài đặt</h1>
        <p className="text-sm text-zinc-500 mt-1">Tuỳ chỉnh giao diện và tài khoản.</p>
      </div>

      {/* Appearance */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">Giao diện</h2>
        <div className="flex gap-2">
          {themeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-colors text-sm ${
                theme === value
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </Card>

      {/* Account & Cloud */}
      <Card className="p-5 space-y-4">
        <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm flex items-center gap-2">
          <Cloud className="h-4 w-4 text-indigo-500" />
          Tài khoản & Cloud
        </h2>

        {!isSupabaseConfigured ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 text-sm">
            <CloudOff className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Supabase chưa được cấu hình</p>
              <p className="text-xs mt-1">Thêm <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">VITE_SUPABASE_URL</code> và <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> vào file <code>.env</code> để bật tính năng Cloud.</p>
            </div>
          </div>
        ) : user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/40">
              {user.avatarUrl && <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 rounded-full" />}
              <div className="min-w-0">
                <p className="font-medium text-zinc-900 dark:text-white text-sm truncate">{user.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user.email}</p>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium">
                  <Cloud className="h-3.5 w-3.5" /> Đã đăng nhập
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" loading={isSyncing} onClick={syncFromCloud} className="flex-1">
                <RefreshCw className="h-4 w-4" /> Đồng bộ từ Cloud
              </Button>
              <Button variant="outline" size="sm" loading={isSyncing} onClick={syncToCloud} className="flex-1">
                <Cloud className="h-4 w-4" /> Đẩy lên Cloud
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={logout}>
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Đăng nhập để đồng bộ thư viện QR giữa nhiều thiết bị qua Supabase Cloud.
            </p>
            <Button variant="primary" size="md" onClick={loginWithGoogle} className="w-full">
              <LogIn className="h-4 w-4" /> Đăng nhập bằng Google
            </Button>
          </div>
        )}
      </Card>

      {/* Info */}
      <Card className="p-5 space-y-3">
        <h2 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm flex items-center gap-2">
          <Info className="h-4 w-4 text-indigo-500" />
          Thông tin
        </h2>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5">
          <p>🔖 <strong>QR Studio</strong> – v1.0.0</p>
          <p>📌 Static QR – QR tải xuống hoạt động độc lập, không phụ thuộc server.</p>
          <p>🔒 Dữ liệu cloud được bảo vệ bằng Supabase Row Level Security.</p>
          <p>💾 Local Mode: lưu trữ hoàn toàn trong trình duyệt (IndexedDB).</p>
        </div>
        <div className="flex gap-2 pt-1">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Source Code
          </a>
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Supabase Docs
          </a>
        </div>
      </Card>

      {/* Security notice */}
      <Card className="p-4">
        <div className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <Shield className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-zinc-700 dark:text-zinc-300">Lưu ý bảo mật</p>
            <p className="text-xs mt-1 leading-relaxed">
              Kiểm tra URL được thực hiện qua Google Safe Browsing/Web Risk. Trạng thái "chưa phát hiện rủi ro" không đồng nghĩa với an toàn tuyệt đối.
              Luôn xác minh URL trước khi chia sẻ QR công khai.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
