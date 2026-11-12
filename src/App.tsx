import { useQRStore } from './store';
import { QREditor } from './components/editor/QREditor';
import { QRLibrary } from './components/library/QRLibrary';
import { SettingsPage } from './components/settings/SettingsPage';
import { Sidebar } from './components/layout/Sidebar';
import { useAuthSync, useThemeSync } from './hooks/useApp';

export function App() {
  useAuthSync();
  useThemeSync();

  const { view } = useQRStore();

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {view === 'editor' && <QREditor />}
        {view === 'library' && <QRLibrary />}
        {view === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
