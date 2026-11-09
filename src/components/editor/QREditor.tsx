import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Link2, AlertTriangle, CheckCircle, XCircle, Loader2, Save, Download, RefreshCw, Copy } from 'lucide-react';
import { useQRStore } from '../../store';
import { createQRInstance, exportQR, checkContrast } from '../../lib/qr';
import { validateUrlSyntax, checkUrlSafety } from '../../lib/urlCheck';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge, Card, Divider } from '../ui/index';
import { DesignPanel } from './DesignPanel';
import { ExportModal } from './ExportModal';
import type { URLSafetyStatus } from '../../types';

function StatusIcon({ status }: { status: URLSafetyStatus }) {
  const cls = 'h-4 w-4 shrink-0';
  if (status === 'checking') return <Loader2 className={`${cls} animate-spin text-blue-500`} />;
  if (status === 'safe') return <CheckCircle className={`${cls} text-green-500`} />;
  if (status === 'danger') return <XCircle className={`${cls} text-red-500`} />;
  if (status === 'warning') return <AlertTriangle className={`${cls} text-yellow-500`} />;
  if (status === 'error') return <AlertTriangle className={`${cls} text-orange-400`} />;
  return <Link2 className={`${cls} text-zinc-400`} />;
}

function statusBadgeVariant(s: URLSafetyStatus): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'safe') return 'success';
  if (s === 'danger') return 'danger';
  if (s === 'warning' || s === 'error') return 'warning';
  return 'default';
}

export function QREditor() {
  const {
    currentUrl, currentDesign, currentName, currentDescription, currentTags,
    urlStatus, urlMessage, normalizedUrl, editingId,
    setUrl, setMeta, setUrlStatus, saveCurrentQR, resetEditor,
  } = useQRStore();

  const previewRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<ReturnType<typeof createQRInstance> | null>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [saved, setSaved] = useState(false);
  const [contrastWarning, setContrastWarning] = useState<string>();

  // Debounced URL check
  const handleUrlChange = useCallback((raw: string) => {
    setUrl(raw);
    if (!raw.trim()) {
      setUrlStatus('unchecked', '', '');
      return;
    }
    setUrlStatus('checking', 'Đang kiểm tra...', '');
    clearTimeout(checkTimer.current);
    checkTimer.current = setTimeout(async () => {
      const { valid, error, normalized } = validateUrlSyntax(raw);
      if (!valid) {
        setUrlStatus('warning', error!, normalized);
        return;
      }
      setUrlStatus('checking', 'Đang kiểm tra độ an toàn...', normalized);
      const result = await checkUrlSafety(normalized);
      setUrlStatus(result.status, result.message, result.normalizedUrl);
    }, 600);
  }, [setUrl, setUrlStatus]);

  // Render QR preview
  useEffect(() => {
    if (!previewRef.current) return;
    const url = normalizedUrl || currentUrl;
    if (!url) {
      previewRef.current.innerHTML = '';
      return;
    }

    if (qrInstanceRef.current) {
      qrInstanceRef.current.update({
        data: url,
        width: 280,
        height: 280,
        margin: currentDesign.margin,
        qrOptions: { errorCorrectionLevel: currentDesign.errorCorrection },
        dotsOptions: { type: currentDesign.dotType, color: currentDesign.foregroundColor },
        backgroundOptions: { color: currentDesign.backgroundColor },
        cornersSquareOptions: { type: currentDesign.cornerSquareType, color: currentDesign.foregroundColor },
        cornersDotOptions: { type: currentDesign.cornerDotType, color: currentDesign.foregroundColor },
        image: currentDesign.logoUrl,
        imageOptions: currentDesign.logoUrl
          ? { crossOrigin: 'anonymous', margin: currentDesign.logoMargin ?? 4, imageSize: (currentDesign.logoSize ?? 30) / 100 }
          : undefined,
      });
    } else {
      const instance = createQRInstance(url, { ...currentDesign, size: 280 });
      instance.append(previewRef.current);
      qrInstanceRef.current = instance;
    }

    // Contrast check
    const { ok, message } = checkContrast(currentDesign.foregroundColor, currentDesign.backgroundColor);
    setContrastWarning(ok ? undefined : message);
  }, [normalizedUrl, currentUrl, currentDesign]);

  const handleSave = async () => {
    if (!currentUrl.trim()) return;
    setIsSaving(true);
    await saveCurrentQR();
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      const tag = tagInput.trim().toLowerCase();
      if (!currentTags.includes(tag)) {
        setMeta({ currentTags: [...currentTags, tag] });
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setMeta({ currentTags: currentTags.filter((t) => t !== tag) });
  };

  const hasValidUrl = (urlStatus === 'safe' || urlStatus === 'unchecked' || urlStatus === 'error') && (normalizedUrl || currentUrl);

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden">
      {/* Left: Controls */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-w-0">
        <div>
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
            {editingId ? 'Chỉnh sửa QR' : 'Tạo QR mới'}
          </h1>
          <p className="text-sm text-zinc-500">Nhập URL, thiết kế và lưu vào thư viện.</p>
        </div>

        {/* URL Input */}
        <Card className="p-4 space-y-3">
          <Input
            label="URL"
            placeholder="example.com hoặc https://..."
            value={currentUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            icon={<StatusIcon status={urlStatus} />}
          />

          {urlMessage && (
            <div className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
              urlStatus === 'danger' ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400' :
              urlStatus === 'safe' ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400' :
              'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400'
            }`}>
              <StatusIcon status={urlStatus} />
              <span>{urlMessage}</span>
            </div>
          )}

          {urlStatus === 'danger' && (
            <p className="text-xs text-red-600 font-medium">
              ⚠️ Bạn vẫn có thể tạo QR, nhưng hãy chắc chắn URL này an toàn trước khi chia sẻ.
            </p>
          )}
        </Card>

        {/* Meta */}
        <Card className="p-4 space-y-3">
          <Input
            label="Tên QR"
            placeholder="Ví dụ: Website cá nhân, Menu nhà hàng..."
            value={currentName}
            onChange={(e) => setMeta({ currentName: e.target.value })}
          />
          <Textarea
            label="Mô tả (tuỳ chọn)"
            placeholder="Ghi chú thêm về QR này..."
            value={currentDescription}
            onChange={(e) => setMeta({ currentDescription: e.target.value })}
            rows={2}
          />
          {/* Tags */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Tags</label>
            <div className="flex flex-wrap gap-1.5 min-h-[2rem] p-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800">
              {currentTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Nhập tag rồi Enter..."
                className="flex-1 min-w-20 bg-transparent text-xs outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
              />
            </div>
          </div>
        </Card>

        {/* Design */}
        <DesignPanel />

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pb-4">
          {editingId && (
            <Button variant="ghost" size="md" onClick={resetEditor}>
              <RefreshCw className="h-4 w-4" /> Tạo mới
            </Button>
          )}
          <Button
            variant="secondary"
            size="md"
            disabled={!hasValidUrl}
            onClick={() => setShowExport(true)}
          >
            <Download className="h-4 w-4" /> Tải xuống
          </Button>
          <Button
            variant="primary"
            size="md"
            loading={isSaving}
            disabled={!currentUrl.trim()}
            onClick={handleSave}
          >
            {saved ? <><CheckCircle className="h-4 w-4" /> Đã lưu!</> : <><Save className="h-4 w-4" /> Lưu vào thư viện</>}
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="lg:w-80 xl:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex flex-col items-center justify-center p-6 gap-4">
        <div className="text-sm font-medium text-zinc-500 mb-2">Xem trước</div>

        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-4 shadow-md">
          <div
            ref={previewRef}
            className="h-[280px] w-[280px] flex items-center justify-center"
          >
            {!currentUrl && (
              <div className="text-center text-zinc-400">
                <QrCode size={48} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nhập URL để xem QR</p>
              </div>
            )}
          </div>
        </div>

        {contrastWarning && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 text-xs max-w-[280px]">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {contrastWarning}
          </div>
        )}

        {normalizedUrl && (
          <div className="text-xs text-zinc-500 text-center max-w-[260px] break-all">
            <span className="font-medium">URL:</span> {normalizedUrl}
          </div>
        )}

        <Badge variant={statusBadgeVariant(urlStatus)}>
          {urlStatus === 'safe' ? '✓ URL đã kiểm tra' :
           urlStatus === 'danger' ? '⚠ URL nguy hiểm' :
           urlStatus === 'unchecked' ? 'Chưa kiểm tra' :
           urlStatus === 'checking' ? 'Đang kiểm tra...' : 'Không thể kiểm tra'}
        </Badge>
      </div>

      {showExport && (
        <ExportModal
          url={normalizedUrl || currentUrl}
          design={currentDesign}
          name={currentName}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

function QrCode({ size, className }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size ?? 24} height={size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="5" height="5" x="3" y="3" rx="1" /><rect width="5" height="5" x="16" y="3" rx="1" /><rect width="5" height="5" x="3" y="16" rx="1" /><path d="M21 16h-3a2 2 0 0 0-2 2v3" /><path d="M21 21v.01" /><path d="M12 7v3a2 2 0 0 1-2 2H7" /><path d="M3 12h.01" /><path d="M12 3h.01" /><path d="M12 16v.01" /><path d="M16 12h1" /><path d="M21 12v.01" /><path d="M12 21v-1" />
    </svg>
  );
}
