import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QRRecord, QRFolder, QRDesign, AppView, Theme, AppUser, URLSafetyStatus } from '../types';
import {
  getAllQRCodes,
  saveQR,
  deleteQR,
  getAllFolders,
  saveFolder,
  deleteFolder,
  searchQRCodes,
  exportLibraryJSON,
  importLibraryJSON,
} from '../lib/db';
import { syncPendingToCloud, fetchAndMergeFromCloud, deleteFromCloud, deleteFolderFromCloud } from '../lib/sync';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const DEFAULT_DESIGN: QRDesign = {
  size: 1024,
  margin: 10,
  foregroundColor: '#000000',
  backgroundColor: '#ffffff',
  dotType: 'rounded',
  cornerSquareType: 'extra-rounded',
  cornerDotType: 'dot',
  errorCorrection: 'H',
  logoUrl: undefined,
  logoSize: 30,
  logoMargin: 4,
  template: 'none',
};

// ─── Editor Slice ─────────────────────────────────────────────────────────────

interface EditorState {
  currentUrl: string;
  currentDesign: QRDesign;
  currentName: string;
  currentDescription: string;
  currentTags: string[];
  currentFolderId: string | null;
  editingId: string | null;
  urlStatus: URLSafetyStatus;
  urlMessage: string;
  normalizedUrl: string;
}

// ─── Full Store ───────────────────────────────────────────────────────────────

interface QRStore extends EditorState {
  // UI
  view: AppView;
  theme: Theme;
  user: AppUser | null;
  isLoading: boolean;
  isSyncing: boolean;
  syncMessage: string;

  // Data
  qrCodes: QRRecord[];
  folders: QRFolder[];
  searchQuery: string;

  // Editor actions
  setUrl: (url: string) => void;
  setDesign: (patch: Partial<QRDesign>) => void;
  setMeta: (patch: Partial<Pick<EditorState, 'currentName' | 'currentDescription' | 'currentTags' | 'currentFolderId'>>) => void;
  setUrlStatus: (status: URLSafetyStatus, message: string, normalized: string) => void;
  resetEditor: () => void;
  loadQRForEdit: (qr: QRRecord) => void;

  // QR CRUD
  saveCurrentQR: () => Promise<QRRecord>;
  cloneQR: (id: string) => Promise<void>;
  removeQR: (id: string) => Promise<void>;
  loadAllQR: () => Promise<void>;
  searchQR: (q: string) => Promise<void>;

  // Folder actions
  loadFolders: () => Promise<void>;
  createFolder: (name: string, color: string) => Promise<void>;
  removeFolder: (id: string) => Promise<void>;

  // Backup
  exportJSON: () => Promise<string>;
  importJSON: (json: string) => Promise<{ imported: number; skipped: number }>;

  // Auth & sync
  setView: (v: AppView) => void;
  setTheme: (t: Theme) => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (u: AppUser | null) => void;
  syncToCloud: () => Promise<void>;
  syncFromCloud: () => Promise<void>;
}

export const useQRStore = create<QRStore>()(
  persist(
    (set, get) => ({
      // Initial editor state
      currentUrl: '',
      currentDesign: { ...DEFAULT_DESIGN },
      currentName: '',
      currentDescription: '',
      currentTags: [],
      currentFolderId: null,
      editingId: null,
      urlStatus: 'unchecked',
      urlMessage: '',
      normalizedUrl: '',

      // Initial UI state
      view: 'editor',
      theme: 'system',
      user: null,
      isLoading: false,
      isSyncing: false,
      syncMessage: '',

      // Initial data state
      qrCodes: [],
      folders: [],
      searchQuery: '',

      // ── Editor ──────────────────────────────────────────────────────────────

      setUrl: (url) => set({ currentUrl: url }),

      setDesign: (patch) =>
        set((s) => ({ currentDesign: { ...s.currentDesign, ...patch } })),

      setMeta: (patch) => set((s) => ({ ...s, ...patch })),

      setUrlStatus: (status, message, normalizedUrl) =>
        set({ urlStatus: status, urlMessage: message, normalizedUrl }),

      resetEditor: () =>
        set({
          currentUrl: '',
          currentDesign: { ...DEFAULT_DESIGN },
          currentName: '',
          currentDescription: '',
          currentTags: [],
          currentFolderId: null,
          editingId: null,
          urlStatus: 'unchecked',
          urlMessage: '',
          normalizedUrl: '',
        }),

      loadQRForEdit: (qr) =>
        set({
          editingId: qr.id,
          currentUrl: qr.url,
          currentDesign: { ...qr.design },
          currentName: qr.name,
          currentDescription: qr.description,
          currentTags: [...qr.tags],
          currentFolderId: qr.folderId,
          view: 'editor',
          normalizedUrl: qr.url,
          urlStatus: 'unchecked',
          urlMessage: '',
        }),

      // ── QR CRUD ─────────────────────────────────────────────────────────────

      saveCurrentQR: async () => {
        const s = get();
        const now = new Date().toISOString();
        const qr: QRRecord = {
          id: s.editingId ?? generateId(),
          name: s.currentName || 'QR không tên',
          description: s.currentDescription,
          url: s.normalizedUrl || s.currentUrl,
          design: { ...s.currentDesign },
          tags: s.currentTags,
          folderId: s.currentFolderId,
          createdAt: s.editingId
            ? (s.qrCodes.find((q) => q.id === s.editingId)?.createdAt ?? now)
            : now,
          updatedAt: now,
          syncStatus: s.user ? 'pending' : 'local',
          revision: (s.qrCodes.find((q) => q.id === s.editingId)?.revision ?? 0),
        };

        await saveQR(qr);
        await get().loadAllQR();

        if (s.user) {
          get().syncToCloud().catch(console.error);
        }

        return qr;
      },

      cloneQR: async (id) => {
        const qr = get().qrCodes.find((q) => q.id === id);
        if (!qr) return;
        const now = new Date().toISOString();
        await saveQR({
          ...qr,
          id: generateId(),
          name: `${qr.name} (copy)`,
          createdAt: now,
          updatedAt: now,
          syncStatus: 'local',
          revision: 0,
        });
        await get().loadAllQR();
      },

      removeQR: async (id) => {
        await deleteQR(id);
        if (get().user) await deleteFromCloud(id).catch(console.error);
        await get().loadAllQR();
      },

      loadAllQR: async () => {
        set({ isLoading: true });
        const qrCodes = await getAllQRCodes();
        set({ qrCodes, isLoading: false });
      },

      searchQR: async (q) => {
        set({ searchQuery: q });
        if (!q.trim()) {
          await get().loadAllQR();
          return;
        }
        const results = await searchQRCodes(q);
        set({ qrCodes: results });
      },

      // ── Folders ─────────────────────────────────────────────────────────────

      loadFolders: async () => {
        const folders = await getAllFolders();
        set({ folders });
      },

      createFolder: async (name, color) => {
        const user = get().user;
        const folder: QRFolder = {
          id: generateId(),
          name,
          color,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          syncStatus: user ? 'pending' : 'local',
          revision: 0,
          userId: user?.id,
        };
        await saveFolder(folder);
        await get().loadFolders();
        if (user) get().syncToCloud().catch(console.error);
      },

      removeFolder: async (id) => {
        if (get().user) await deleteFolderFromCloud(id);
        await deleteFolder(id);
        await get().loadFolders();
        await get().loadAllQR();
      },

      // ── Backup ──────────────────────────────────────────────────────────────

      exportJSON: async () => exportLibraryJSON(),

      importJSON: async (json) => {
        const result = await importLibraryJSON(json);
        await get().loadAllQR();
        return result;
      },

      // ── UI ──────────────────────────────────────────────────────────────────

      setView: (view) => set({ view }),
      setTheme: (theme) => set({ theme }),

      // ── Auth ────────────────────────────────────────────────────────────────

      setUser: (user) => set({ user }),

      loginWithGoogle: async () => {
        if (!isSupabaseConfigured || !supabase) {
          alert('Supabase chưa được cấu hình. Vui lòng thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY vào .env');
          return;
        }
        const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).toString();
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo },
        });
        if (error) throw error;
      },

      logout: async () => {
        if (supabase) await supabase.auth.signOut();
        set({ user: null });
      },

      // ── Sync ────────────────────────────────────────────────────────────────

      syncToCloud: async () => {
        const { user } = get();
        if (!user) return;
        set({ isSyncing: true, syncMessage: '' });
        try {
          const result = await syncPendingToCloud(user.id);
          const message = result.failed
            ? `Đồng bộ ${result.synced} mục, ${result.failed} mục thất bại.`
            : `Đã đồng bộ ${result.synced} mục lên Cloud.`;
          set({ syncMessage: message });
          await Promise.all([get().loadAllQR(), get().loadFolders()]);
        } catch (error) {
          set({ syncMessage: `Đồng bộ thất bại: ${error instanceof Error ? error.message : String(error)}` });
        } finally {
          set({ isSyncing: false });
        }
      },

      syncFromCloud: async () => {
        const { user } = get();
        if (!user) return;
        set({ isSyncing: true, syncMessage: '' });
        try {
          const merged = await fetchAndMergeFromCloud(user.id);
          await Promise.all([get().loadAllQR(), get().loadFolders()]);
          set({ syncMessage: `Đã tải và cập nhật ${merged} mục từ Cloud.` });
        } catch (error) {
          set({ syncMessage: `Tải Cloud thất bại: ${error instanceof Error ? error.message : String(error)}` });
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'qr-studio-ui',
      partialize: (s) => ({
        theme: s.theme,
        currentDesign: s.currentDesign,
        view: s.view,
      }),
    }
  )
);
