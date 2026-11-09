import React, { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Trash2, Edit2, Copy, Download, FolderOpen,
  MoreVertical, Upload, FileJson, Tag, Grid3X3, List,
} from 'lucide-react';
import { useQRStore } from '../../store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, Badge } from '../ui/index';
import { formatDate, truncate } from '../../lib/utils';
import { createQRInstance, exportQR } from '../../lib/qr';
import type { QRRecord } from '../../types';

function QRMiniPreview({ qr }: { qr: QRRecord }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mounted = React.useRef(false);

  useEffect(() => {
    if (!ref.current || !qr.url) return;
    if (mounted.current) return;
    mounted.current = true;
    const instance = createQRInstance(qr.url, { ...qr.design, size: 100 });
    instance.append(ref.current);
  }, [qr]);

  return <div ref={ref} className="h-[100px] w-[100px] overflow-hidden rounded-lg" />;
}

function QRCard({ qr, onEdit, onDelete, onClone, onDownload }: {
  qr: QRRecord;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
  onDownload: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Card hover className="p-4 flex gap-4 relative">
      <div className="shrink-0">
        <QRMiniPreview qr={qr} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm truncate">{qr.name}</h3>
            {qr.description && (
              <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{qr.description}</p>
            )}
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 truncate">{truncate(qr.url, 50)}</p>
          </div>
          <div className="relative shrink-0">
            <Button size="icon" variant="ghost" onClick={() => setMenuOpen((p) => !p)}>
              <MoreVertical className="h-4 w-4" />
            </Button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl w-44 py-1 text-sm">
                <MenuItem icon={Edit2} label="Chỉnh sửa" onClick={() => { onEdit(); setMenuOpen(false); }} />
                <MenuItem icon={Copy} label="Nhân bản" onClick={() => { onClone(); setMenuOpen(false); }} />
                <MenuItem icon={Download} label="Tải xuống" onClick={() => { onDownload(); setMenuOpen(false); }} />
                <div className="h-px bg-zinc-200 dark:bg-zinc-700 my-1" />
                <MenuItem icon={Trash2} label="Xóa" danger onClick={() => { onDelete(); setMenuOpen(false); }} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          {qr.tags.map((tag) => (
            <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-zinc-400">{formatDate(qr.updatedAt)}</span>
          <Badge
            variant={qr.syncStatus === 'synced' ? 'success' : qr.syncStatus === 'pending' ? 'info' : 'default'}
          >
            {qr.syncStatus === 'synced' ? '☁ Synced' : qr.syncStatus === 'pending' ? '↑ Pending' : '💾 Local'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: React.ElementType; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${danger ? 'text-red-600' : 'text-zinc-700 dark:text-zinc-300'}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

export function QRLibrary() {
  const { qrCodes, loadAllQR, loadFolders, searchQR, searchQuery, loadQRForEdit, removeQR, cloneQR, exportJSON, importJSON } = useQRStore();
  const [isLoading, setIsLoading] = useState(true);
  const [importStatus, setImportStatus] = useState('');

  useEffect(() => {
    Promise.all([loadAllQR(), loadFolders()]).finally(() => setIsLoading(false));
  }, []);

  const handleSearch = useCallback((q: string) => {
    searchQR(q);
  }, [searchQR]);

  const handleExport = async () => {
    const json = await exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-studio-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const { imported, skipped } = await importJSON(text);
        setImportStatus(`✅ Đã nhập ${imported} QR, bỏ qua ${skipped} trùng lặp.`);
        setTimeout(() => setImportStatus(''), 4000);
      } catch {
        setImportStatus('❌ File không hợp lệ.');
        setTimeout(() => setImportStatus(''), 3000);
      }
    };
    input.click();
  };

  const handleQuickDownload = async (qr: QRRecord) => {
    await exportQR(qr.url, qr.design, {
      format: 'png',
      size: qr.design.size,
      filename: qr.name.replace(/\s+/g, '-').toLowerCase(),
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 md:p-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 min-w-48">
          <Input
            placeholder="Tìm kiếm QR, URL, tag..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button variant="ghost" size="sm" onClick={handleImport} title="Nhập từ JSON">
          <Upload className="h-4 w-4" /> Nhập
        </Button>
        <Button variant="ghost" size="sm" onClick={handleExport} title="Xuất ra JSON">
          <FileJson className="h-4 w-4" /> Xuất
        </Button>
      </div>

      {importStatus && (
        <div className="mx-6 mt-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-sm">
          {importStatus}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-zinc-400">
            <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-zinc-400 gap-3">
            <Grid3X3 className="h-12 w-12 opacity-30" />
            <div className="text-center">
              <p className="font-medium">Thư viện trống</p>
              <p className="text-sm mt-1">Tạo QR đầu tiên từ tab QR Editor</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-500">{qrCodes.length} mã QR</p>
            {qrCodes.map((qr) => (
              <QRCard
                key={qr.id}
                qr={qr}
                onEdit={() => loadQRForEdit(qr)}
                onDelete={() => removeQR(qr.id)}
                onClone={() => cloneQR(qr.id)}
                onDownload={() => handleQuickDownload(qr)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
