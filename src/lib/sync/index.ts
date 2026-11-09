import { supabase, isSupabaseConfigured } from '../supabase';
import { db, saveQR, updateQR } from '../db';
import type { QRRecord } from '../../types';

/**
 * Push local pending QR codes to Supabase.
 */
export async function syncPendingToCloud(userId: string): Promise<{ synced: number; failed: number }> {
  if (!isSupabaseConfigured || !supabase) return { synced: 0, failed: 0 };

  const pending = await db.qrCodes
    .where('syncStatus')
    .anyOf(['pending', 'local'])
    .toArray();

  let synced = 0;
  let failed = 0;

  for (const qr of pending) {
    try {
      const { error } = await supabase.from('qr_codes').upsert({
        id: qr.id,
        user_id: userId,
        name: qr.name,
        description: qr.description,
        url: qr.url,
        design: qr.design,
        tags: qr.tags,
        folder_id: qr.folderId,
        created_at: qr.createdAt,
        updated_at: qr.updatedAt,
        revision: (qr.revision ?? 0) + 1,
      });

      if (error) throw error;

      await updateQR(qr.id, { syncStatus: 'synced', revision: (qr.revision ?? 0) + 1 });
      synced++;
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/**
 * Fetch all QR codes from cloud and merge into local DB.
 * Conflict resolution: use updated_at + revision. Cloud wins if revision > local.
 */
export async function fetchAndMergeFromCloud(userId: string): Promise<number> {
  if (!isSupabaseConfigured || !supabase) return 0;

  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('user_id', userId);

  if (error || !data) return 0;

  let merged = 0;
  for (const row of data) {
    const qr: QRRecord = {
      id: row.id,
      name: row.name,
      description: row.description,
      url: row.url,
      design: row.design,
      tags: row.tags ?? [],
      folderId: row.folder_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncStatus: 'synced',
      revision: row.revision ?? 0,
      userId: row.user_id,
    };

    const local = await db.qrCodes.get(qr.id);
    if (!local) {
      await saveQR(qr);
      merged++;
    } else {
      // Conflict: cloud wins if revision is higher or updatedAt is newer
      const cloudRevision = qr.revision ?? 0;
      const localRevision = local.revision ?? 0;
      if (cloudRevision > localRevision || qr.updatedAt > local.updatedAt) {
        await saveQR({ ...qr, syncStatus: 'synced' });
        merged++;
      }
    }
  }

  return merged;
}

/**
 * Delete a QR from cloud.
 */
export async function deleteFromCloud(id: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  await supabase.from('qr_codes').delete().eq('id', id);
}
