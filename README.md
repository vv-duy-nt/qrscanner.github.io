# QR Studio

> Tạo và quản lý mã QR cá nhân – Miễn phí, không cần đăng nhập, hỗ trợ Cloud.

**Live demo:** https://[username].github.io/QR-Generated/

---

## Tính năng

- 🎨 **Tùy chỉnh QR** – màu sắc, kiểu chấm, hình mắt, logo, margin
- 📤 **Xuất file** – PNG, JPEG, SVG, PDF (A4/A5/A6)
- 💾 **Local Mode** – Lưu thư viện ngay trên trình duyệt (IndexedDB), không cần đăng nhập
- ☁️ **Cloud Mode** – Đăng nhập Google, đồng bộ qua Supabase
- 🔒 **Kiểm tra URL** – Google Safe Browsing/Web Risk (qua Edge Function)
- 📱 **PWA** – Cài website như ứng dụng
- 🌙 **Dark mode** – Light / Dark / System

## Stack

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | React 19 + Vite 8 + TypeScript 7 |
| UI | Tailwind CSS v4 |
| QR | qr-code-styling |
| PDF | jsPDF |
| Local DB | Dexie.js (IndexedDB) |
| Cloud | Supabase (PostgreSQL + Auth + Edge Functions) |
| Hosting | GitHub Pages |
| CI/CD | GitHub Actions |

## Cài đặt & Chạy local

```bash
git clone https://github.com/[username]/QR-Generated.git
cd QR-Generated
npm install
cp .env.example .env     # điền Supabase keys nếu muốn dùng Cloud
npm run dev
```

## Cấu hình Supabase (tùy chọn)

1. Tạo project tại [app.supabase.com](https://app.supabase.com)
2. Chạy migration: `supabase/migrations/001_initial.sql`
3. Bật Google Auth trong Authentication > Providers
4. Thêm vào `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Deploy Edge Function:
   ```bash
   supabase functions deploy check-url
   supabase secrets set GOOGLE_WEB_RISK_API_KEY=your_key
   ```

## Deploy lên GitHub Pages

Thêm secrets vào repository (Settings > Secrets and variables > Actions):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Push lên branch `main` → GitHub Actions tự build và deploy.

## Chi phí

| Dịch vụ | Chi phí |
|---------|---------|
| GitHub Pages | $0 |
| Supabase Free | $0 |
| Google OAuth | $0 |
| Google Web Risk (≤100k/tháng) | $0 |
| **Tổng** | **$0/tháng** |

## Kiến trúc

```
src/
├── App.tsx                    # Root component
├── components/
│   ├── editor/
│   │   ├── QREditor.tsx       # Màn hình tạo/chỉnh sửa QR
│   │   ├── DesignPanel.tsx    # Bảng tùy chỉnh thiết kế
│   │   └── ExportModal.tsx    # Modal tải xuống
│   ├── library/
│   │   └── QRLibrary.tsx      # Thư viện QR
│   ├── settings/
│   │   └── SettingsPage.tsx   # Cài đặt & tài khoản
│   ├── layout/
│   │   └── Sidebar.tsx        # Thanh điều hướng
│   └── ui/                    # UI primitives (Button, Input, Card...)
├── store/index.ts             # Zustand store (toàn bộ state)
├── lib/
│   ├── db/index.ts            # Dexie.js (IndexedDB)
│   ├── qr/index.ts            # QR rendering & export
│   ├── sync/index.ts          # Cloud sync logic
│   ├── urlCheck.ts            # URL validation & safety check
│   └── supabase.ts            # Supabase client
├── hooks/useApp.ts            # Auth sync & theme
└── types/index.ts             # TypeScript types

supabase/
├── functions/check-url/       # Edge Function: URL safety check
└── migrations/001_initial.sql # Database schema + RLS
```

## Nguyên tắc thiết kế

- ✅ Không bắt buộc đăng nhập để tạo QR
- ✅ QR tải xuống là **Static QR** – không phụ thuộc server sau khi tải
- ✅ Không lưu ảnh QR lên cloud – tái tạo từ config JSON
- ✅ API key bảo mật chỉ nằm trong Edge Function
- ✅ RLS đảm bảo mỗi user chỉ truy cập dữ liệu của mình
- ✅ Conflict resolution: `updated_at` + `revision`

## License

MIT
