import type { URLCheckResult } from '../types';
import { supabase, isSupabaseConfigured } from './supabase';

/** Supported URL schemes */
const ALLOWED_SCHEMES = ['http:', 'https:'];

/**
 * Normalize a raw user input URL.
 * - Adds https:// if scheme missing
 * - Does NOT modify path / query / fragment
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Step 1 – Syntax validation only (runs client-side, no network).
 */
export function validateUrlSyntax(raw: string): { valid: boolean; error?: string; normalized: string } {
  const normalized = normalizeUrl(raw);
  if (!normalized) return { valid: false, error: 'URL không được để trống.', normalized: '' };

  try {
    const url = new URL(normalized);
    if (!ALLOWED_SCHEMES.includes(url.protocol)) {
      return { valid: false, error: `Chỉ hỗ trợ HTTP/HTTPS. Giao thức "${url.protocol}" không được chấp nhận.`, normalized };
    }
    if (!url.hostname || url.hostname.length < 2) {
      return { valid: false, error: 'Hostname không hợp lệ.', normalized };
    }
    return { valid: true, normalized };
  } catch {
    return { valid: false, error: 'URL không hợp lệ. Vui lòng kiểm tra lại.', normalized };
  }
}

/**
 * Step 2 – Safety check via Supabase Edge Function.
 * Falls back gracefully if Edge Function is unavailable.
 */
export async function checkUrlSafety(normalizedUrl: string): Promise<URLCheckResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      status: 'unchecked',
      message: 'Chưa cấu hình dịch vụ kiểm tra URL. QR sẽ được tạo nhưng URL chưa được xác minh.',
      normalizedUrl,
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('check-url', {
      body: { url: normalizedUrl },
    });
    if (error) throw error;
    const result = data as { safe: boolean | null; threats?: string[]; message?: string };

    if (result.safe === true) {
      return {
        status: 'safe',
        message: 'Chưa phát hiện rủi ro. (Không đảm bảo an toàn tuyệt đối.)',
        normalizedUrl,
      };
    }
    if (result.safe === false) {
      return {
        status: 'danger',
        message: `Cảnh báo: URL này có thể nguy hiểm. Mối đe dọa phát hiện: ${(result.threats ?? []).join(', ')}`,
        normalizedUrl,
      };
    }
    return { status: 'error', message: result.message ?? 'Dịch vụ kiểm tra URL chưa sẵn sàng.', normalizedUrl };
  } catch {
    return {
      status: 'error',
      message: 'Không thể kiểm tra URL lúc này. QR vẫn có thể được tạo.',
      normalizedUrl,
    };
  }
}

/**
 * Combined check: syntax + safety.
 */
export async function fullUrlCheck(raw: string): Promise<URLCheckResult> {
  const { valid, error, normalized } = validateUrlSyntax(raw);
  if (!valid) {
    return { status: 'warning', message: error!, normalizedUrl: normalized };
  }
  return checkUrlSafety(normalized);
}
