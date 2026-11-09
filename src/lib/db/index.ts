import Dexie, { type Table } from 'dexie';
import type { QRRecord, QRFolder } from '../../types';

export class QRStudioDB extends Dexie {
  qrCodes!: Table<QRRecord>;
  folders!: Table<QRFolder>;

  constructor() {
    super('QRStudioDB');
    this.version(1).stores({
      qrCodes:
        'id, name, url, folderId, createdAt, updatedAt, syncStatus, userId',
      folders: 'id, name, createdAt',
    });
  }
}

export const db = new QRStudioDB();

// ─── QR CRUD ──────────────────────────────────────────────────────────────────

export async function getAllQRCodes(): Promise<QRRecord[]> {
  return db.qrCodes.orderBy('updatedAt').reverse().toArray();
}

export async function getQRById(id: string): Promise<QRRecord | undefined> {
  return db.qrCodes.get(id);
}

export async function saveQR(qr: QRRecord): Promise<void> {
  await db.qrCodes.put(qr);
}

export async function updateQR(
  id: string,
  patch: Partial<QRRecord>
): Promise<void> {
  await db.qrCodes.update(id, { ...patch, updatedAt: new Date().toISOString() });
}

export async function deleteQR(id: string): Promise<void> {
  await db.qrCodes.delete(id);
}

export async function searchQRCodes(query: string): Promise<QRRecord[]> {
  const q = query.toLowerCase();
  return db.qrCodes
    .filter(
      (qr) =>
        qr.name.toLowerCase().includes(q) ||
        qr.url.toLowerCase().includes(q) ||
        qr.description.toLowerCase().includes(q) ||
        qr.tags.some((t: string) => t.toLowerCase().includes(q))
    )
    .toArray();
}

// ─── Folder CRUD ──────────────────────────────────────────────────────────────

export async function getAllFolders(): Promise<QRFolder[]> {
  return db.folders.orderBy('name').toArray();
}

export async function saveFolder(folder: QRFolder): Promise<void> {
  await db.folders.put(folder);
}

export async function deleteFolder(id: string): Promise<void> {
  // Move QR codes to no folder
  await db.qrCodes.where('folderId').equals(id).modify({ folderId: null });
  await db.folders.delete(id);
}

// ─── Backup / Restore ─────────────────────────────────────────────────────────

export async function exportLibraryJSON(): Promise<string> {
  const [qrCodes, folders] = await Promise.all([getAllQRCodes(), getAllFolders()]);
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), qrCodes, folders }, null, 2);
}

export async function importLibraryJSON(json: string): Promise<{ imported: number; skipped: number }> {
  const data = JSON.parse(json);
  if (!data.qrCodes || !Array.isArray(data.qrCodes)) throw new Error('Invalid backup format');
  
  let imported = 0;
  let skipped = 0;

  for (const qr of data.qrCodes) {
    const existing = await getQRById(qr.id);
    if (!existing) {
      await saveQR({ ...qr, syncStatus: 'local' });
      imported++;
    } else {
      skipped++;
    }
  }

  if (data.folders) {
    for (const folder of data.folders) {
      await saveFolder(folder);
    }
  }

  return { imported, skipped };
}
