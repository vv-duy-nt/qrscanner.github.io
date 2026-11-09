import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { exportQR } from '../../lib/qr';
import { Button } from '../ui/Button';
import { slugify } from '../../lib/utils';
import type { QRDesign, ExportFormat, ExportOptions } from '../../types';

interface Props {
  url: string;
  design: QRDesign;
  name: string;
  onClose: () => void;
}

export function ExportModal({ url, design, name, onClose }: Props) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [size, setSize] = useState(design.size);
  const [pdfSize, setPdfSize] = useState<ExportOptions['pdfSize']>('A4');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const filename = slugify(name || 'qr-code');

  const handleExport = async () => {
    if (!url) return;
    setIsExporting(true);
    setError('');
    try {
      await exportQR(url, design, {
        format,
        size,
        filename,
        pdfSize,
      });
    } catch (e) {
      setError('Xuất file thất bại. Vui lòng thử lại.');
      console.error(e);
    }
    setIsExporting(false);
  };

  const formats: Array<{ value: ExportFormat; label: string }> = [
    { value: 'png', label: 'PNG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'svg', label: 'SVG' },
    { value: 'pdf', label: 'PDF' },
  ];

  const sizes = [256, 512, 1024, 2048, 4096];
  const pdfSizes: Array<{ value: ExportOptions['pdfSize']; label: string }> = [
    { value: 'A4', label: 'A4 (210×297 mm)' },
    { value: 'A5', label: 'A5 (148×210 mm)' },
    { value: 'A6', label: 'A6 (105×148 mm)' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm border border-zinc-200 dark:border-zinc-700">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="font-semibold text-zinc-900 dark:text-white">Tải xuống QR</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Format */}
          <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">Định dạng</label>
            <div className="grid grid-cols-4 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
                    format === f.value
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size – for image formats */}
          {format !== 'pdf' && (
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">Kích thước</label>
              <div className="grid grid-cols-5 gap-1.5">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      size === s
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 hover:border-indigo-400'
                    }`}
                  >
                    {s >= 1024 ? `${s / 1024}K` : s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PDF Size */}
          {format === 'pdf' && (
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 block mb-2">Khổ giấy</label>
              <div className="grid grid-cols-3 gap-2">
                {pdfSizes.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPdfSize(p.value)}
                    className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                      pdfSize === p.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filename */}
          <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
            📄 {filename}.{format}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="flex gap-2 p-5 pt-0">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Huỷ
          </Button>
          <Button variant="primary" size="md" className="flex-1" loading={isExporting} onClick={handleExport}>
            <Download className="h-4 w-4" /> Tải xuống
          </Button>
        </div>
      </div>
    </div>
  );
}
