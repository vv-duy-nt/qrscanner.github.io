import { supabase, isSupabaseConfigured } from '../supabase';
import { db, saveQR, updateQR, saveFolder } from '../db';
import type { QRRecord, QRFolder } from '../../types';

export interface SyncReport { synced: number; failed: number }

/** Push folders before QR codes so folder foreign keys always exist. */
export async function syncPendingToCloud(userId: string): Promise<SyncReport> {
  if (!isSupabaseConfigured || !supabase) return { synced: 0, failed: 0 };
  let synced = 0;
  let failed = 0;

  // filter() also includes folders created before syncStatus was introduced.
  const folders = await db.folders.filter((folder) => folder.syncStatus !== 'synced').toArray();
  for (const folder of folders) {
    const revision = (folder.revision ?? 0) + 1;
    const { error } = await supabase.from('folders').upsert({
      id: folder.id, user_id: userId, name: folder.name, color: folder.color,
      created_at: folder.createdAt, updated_at: folder.updatedAt, revision,
    });
    if (error) failed++;
    else {
      await db.folders.update(folder.id, { syncStatus: 'synced', revision, userId });
      synced++;
    }
  }

  const qrCodes = await db.qrCodes.where('syncStatus').anyOf(['pending', 'local']).toArray();
  for (const qr of qrCodes) {
    const revision = (qr.revision ?? 0) + 1;
    const { error } = await supabase.from('qr_codes').upsert({
      id: qr.id, user_id: userId, name: qr.name, description: qr.description,
      url: qr.url, design: qr.design, tags: qr.tags, folder_id: qr.folderId,
      created_at: qr.createdAt, updated_at: qr.updatedAt, revision,
    });
    if (error) failed++;
    else {
      await updateQR(qr.id, { syncStatus: 'synced', revision, userId });
      synced++;
    }
  }
  return { synced, failed };
}

/** Fetch cloud folders first, then merge QR codes by revision and timestamp. */
export async function fetchAndMergeFromCloud(userId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;
  const foldersResult = await supabase.from('folders').select('*').eq('user_id', userId);
  if (foldersResult.error) throw foldersResult.error;

  let merged = 0;
  for (const row of foldersResult.data ?? []) {
    const folder: QRFolder = {
      id: row.id, name: row.name, color: row.color,
      createdAt: row.created_at, updatedAt: row.updated_at,
      syncStatus: 'synced', revision: row.revision ?? 0, userId: row.user_id,
    };
    const local = await db.folders.get(folder.id);
    if (!local || (folder.revision ?? 0) > (local.revision ?? 0) || folder.updatedAt > local.updatedAt) {
      await saveFolder(folder);
      merged++;
    }
  }

  const qrResult = await supabase.from('qr_codes').select('*').eq('user_id', userId);
  if (qrResult.error) throw qrResult.error;
  for (const row of qrResult.data ?? []) {
    const qr: QRRecord = {
      id: row.id, name: row.name, description: row.description, url: row.url,
      design: row.design, tags: row.tags ?? [], folderId: row.folder_id,
      createdAt: row.created_at, updatedAt: row.updated_at,
      syncStatus: 'synced', revision: row.revision ?? 0, userId: row.user_id,
    };
    const local = await db.qrCodes.get(qr.id);
    if (!local || (qr.revision ?? 0) > (local.revision ?? 0) || qr.updatedAt > local.updatedAt) {
      await saveQR(qr);
      merged++;
    }
  }
  return merged;
}

export async function deleteFromCloud(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('qr_codes').delete().eq('id', id);
  if (error) throw error;
}

export async function deleteFolderFromCloud(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) throw error;
}
