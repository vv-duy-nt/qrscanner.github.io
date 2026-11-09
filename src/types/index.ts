// ─── QR Types ────────────────────────────────────────────────────────────────

export type DotType =
  | 'square'
  | 'dots'
  | 'rounded'
  | 'extra-rounded'
  | 'classy'
  | 'classy-rounded';

export type CornerSquareType = 'square' | 'dot' | 'extra-rounded';
export type CornerDotType = 'square' | 'dot';
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type ExportFormat = 'png' | 'jpeg' | 'svg' | 'webp' | 'pdf';

export interface QRGradient {
  type: 'linear' | 'radial';
  rotation?: number;
  colorStops: Array<{ offset: number; color: string }>;
}

export interface QRDesign {
  size: number;
  margin: number;
  foregroundColor: string;
  backgroundColor: string;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
  errorCorrection: ErrorCorrectionLevel;
  logoUrl?: string;
  logoSize?: number;
  logoMargin?: number;
  gradient?: QRGradient;
  template?: string;
}

export interface QRRecord {
  id: string;
  name: string;
  description: string;
  url: string;
  design: QRDesign;
  tags: string[];
  folderId: string | null;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus?: 'local' | 'synced' | 'pending' | 'conflict';
  revision?: number;
  userId?: string;
}

// ─── URL Check Types ──────────────────────────────────────────────────────────

export type URLSafetyStatus = 'safe' | 'warning' | 'danger' | 'unchecked' | 'checking' | 'error';

export interface URLCheckResult {
  status: URLSafetyStatus;
  message: string;
  normalizedUrl: string;
}

// ─── Folder Types ─────────────────────────────────────────────────────────────

export interface QRFolder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Export Types ─────────────────────────────────────────────────────────────

export interface ExportOptions {
  format: ExportFormat;
  size: number;
  filename: string;
  pdfSize?: 'A4' | 'A5' | 'A6' | 'custom';
  pdfWidthMm?: number;
  pdfHeightMm?: number;
}

// ─── App Types ────────────────────────────────────────────────────────────────

export type AppView = 'editor' | 'library' | 'settings';
export type Theme = 'light' | 'dark' | 'system';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
