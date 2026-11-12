import QRCodeStyling from 'qr-code-styling';
import { jsPDF } from 'jspdf';
import type { QRDesign, ExportOptions } from '../../types';

const BYTE_CAPACITY = { L: 2953, M: 2331, Q: 1663, H: 1273 } as const;

/** Return a user-facing error when data cannot fit in a version 40 byte-mode QR. */
export function getQRCapacityError(data: string, design: Pick<QRDesign, 'errorCorrection'>): string | undefined {
  const bytes = new TextEncoder().encode(data).length;
  const capacity = BYTE_CAPACITY[design.errorCorrection];
  if (bytes <= capacity) return undefined;

  return `URL quá dài để tạo QR ở mức sửa lỗi ${design.errorCorrection} (${bytes.toLocaleString('vi-VN')}/${capacity.toLocaleString('vi-VN')} byte). Hãy rút gọn URL hoặc chọn mức sửa lỗi thấp hơn.`;
}

/** Build QRCodeStyling options from our design object */
function buildQROptions(url: string, design: QRDesign, size?: number): ConstructorParameters<typeof QRCodeStyling>[0] {
  const s = size ?? design.size;
  return {
    width: s,
    height: s,
    data: url,
    margin: design.margin,
    qrOptions: { errorCorrectionLevel: design.errorCorrection },
    dotsOptions: {
      type: design.dotType,
      color: design.foregroundColor,
      gradient: design.gradient
        ? {
            type: design.gradient.type,
            rotation: design.gradient.rotation ?? 0,
            colorStops: design.gradient.colorStops,
          }
        : undefined,
    },
    backgroundOptions: { color: design.backgroundColor },
    cornersSquareOptions: { type: design.cornerSquareType, color: design.foregroundColor },
    cornersDotOptions: { type: design.cornerDotType, color: design.foregroundColor },
    image: design.logoUrl ?? undefined,
    // qr-code-styling 1.9.x does not tolerate an explicit undefined here:
    // it replaces the defaults and then reads imageOptions.hideBackgroundDots.
    imageOptions: {
      crossOrigin: 'anonymous',
      hideBackgroundDots: true,
      margin: design.logoMargin ?? 4,
      imageSize: (design.logoSize ?? 30) / 100,
    },
  };
}

/**
 * Create a QRCodeStyling instance for preview (attaches to a DOM element).
 */
export function createQRInstance(url: string, design: QRDesign): QRCodeStyling {
  return new QRCodeStyling(buildQROptions(url, design));
}

/**
 * Export a QR to Blob.
 */
async function qrToBlob(url: string, design: QRDesign, format: 'png' | 'jpeg' | 'svg' | 'webp', size: number): Promise<Blob> {
  const qr = new QRCodeStyling(buildQROptions(url, design, size));
  const ext = format === 'jpeg' ? 'jpeg' : format === 'webp' ? 'png' : format; // qr-code-styling supports png/svg/jpeg
  return qr.getRawData(ext as 'png' | 'svg' | 'jpeg') as Promise<Blob>;
}

/**
 * Download QR in given format.
 */
export async function exportQR(url: string, design: QRDesign, options: ExportOptions): Promise<void> {
  const { format, size, filename } = options;

  if (format === 'pdf') {
    await exportQRPDF(url, design, options);
    return;
  }

  const blob = await qrToBlob(url, design, format as 'png' | 'jpeg' | 'svg' | 'webp', size);
  if (!blob) throw new Error('Failed to generate QR blob');
  downloadBlob(blob, `${filename}.${format}`);
}

async function exportQRPDF(url: string, design: QRDesign, options: ExportOptions): Promise<void> {
  const { size, filename, pdfSize = 'A4', pdfWidthMm, pdfHeightMm } = options;

  const blob = await qrToBlob(url, design, 'png', size);
  const imgDataUrl = await blobToDataUrl(blob);

  let w = 210, h = 297; // A4 default mm
  if (pdfSize === 'A5') { w = 148; h = 210; }
  else if (pdfSize === 'A6') { w = 105; h = 148; }
  else if (pdfSize === 'custom' && pdfWidthMm && pdfHeightMm) { w = pdfWidthMm; h = pdfHeightMm; }

  const pdf = new jsPDF({ unit: 'mm', format: [w, h] });
  const margin = 10;
  const imgSize = Math.min(w, h) - margin * 2;
  const x = (w - imgSize) / 2;
  const y = (h - imgSize) / 2;
  pdf.addImage(imgDataUrl, 'PNG', x, y, imgSize, imgSize);
  pdf.save(`${filename}.pdf`);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Check if QR contrast is sufficient (simple luminance heuristic) */
export function checkContrast(fg: string, bg: string): { ok: boolean; message?: string } {
  const fgL = relativeLuminance(fg);
  const bgL = relativeLuminance(bg);
  const ratio = (Math.max(fgL, bgL) + 0.05) / (Math.min(fgL, bgL) + 0.05);
  if (ratio < 3) {
    return { ok: false, message: `Độ tương phản thấp (${ratio.toFixed(1)}:1). QR có thể khó quét.` };
  }
  return { ok: true };
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null;
}
