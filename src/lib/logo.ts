export interface NormalizedLogoUrl {
  url: string;
  isGoogleDrive: boolean;
}

/** Convert common Google Drive sharing links to a URL usable as an image source. */
export function normalizeLogoUrl(raw: string): NormalizedLogoUrl {
  const value = raw.trim();
  if (!value) return { url: '', isGoogleDrive: false };

  try {
    const parsed = new URL(value);
    const isDrive = parsed.hostname === 'drive.google.com' || parsed.hostname === 'www.drive.google.com';
    if (!isDrive) return { url: value, isGoogleDrive: false };

    const pathMatch = parsed.pathname.match(/\/file\/d\/([^/]+)/);
    const fileId = pathMatch?.[1] || parsed.searchParams.get('id');
    if (!fileId) return { url: value, isGoogleDrive: false };

    return {
      url: `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`,
      isGoogleDrive: true,
    };
  } catch {
    return { url: value, isGoogleDrive: false };
  }
}
