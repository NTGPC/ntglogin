# NTG Login Admin Web

Admin web UI để quản trị NTG Login - Vite + React + TypeScript + Tailwind + shadcn/ui + axios + TanStack Table.

## Tổng quan

Đây là một admin panel hoàn chỉnh để quản lý NTG Login system với các chức năng quản lý profiles, proxies, sessions, jobs và executions. Ứng dụng được xây dựng với stack hiện đại và responsive trên mọi thiết bị.

## Tính năng

- ✅ Dashboard với stats cards (Profiles/Proxies/Sessions/Jobs)
- ✅ Profiles: CRUD + Start session
- ✅ Proxies: CRUD (password được gửi raw để backend encrypt)
- ✅ Fingerprints: CRUD với JSON editor
- ✅ Sessions: List realtime với Socket.IO + Stop button
- ✅ Jobs: Tạo job với multiple profiles + workflow
- ✅ Executions: List job executions với realtime status + xem/tải screenshot
- ✅ Dark mode
- ✅ Responsive layout với sidebar + topbar

## Cài đặt

1. **Tạo file `.env`** trong thư mục `packages/admin-web`:

```env
VITE_API_BASE_URL=http://127.0.0.1:3000
```

2. **Cài đặt dependencies**:

```bash
cd packages/admin-web
npm install
```

3. **Chạy development server**:

```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:5174`.

## Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run preview` - Preview production build

## Cấu trúc

```
packages/admin-web/
├── src/
│   ├── components/
│   │   ├── layout/          # Layout components (Sidebar, Topbar)
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts           # API client và functions
│   │   └── utils.ts         # Utility functions
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Profiles.tsx
│   │   ├── Proxies.tsx
│   │   ├── Fingerprints.tsx
│   │   ├── Sessions.tsx
│   │   ├── Jobs.tsx
│   │   └── Executions.tsx
│   ├── App.tsx              # Root component với routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## API Client

API client được cấu hình trong `src/lib/api.ts`:

- Tự động đọc `VITE_API_BASE_URL` từ env (mặc định: `http://127.0.0.1:3000`)
- Token interceptor (sẵn sàng cho authentication)
- Các hàm API cho tất cả endpoints

## Lưu ý

- **Authentication**: API client có sẵn token interceptor. Khi backend bật authentication, cần thêm login page và lưu token vào localStorage với key `auth_token`
- Nếu backend không có endpoint `/api/stats`, UI sẽ hiển thị cảnh báo và dashboard vẫn hoạt động
- Socket.IO được sử dụng cho realtime updates (Sessions & Executions). Nếu backend không hỗ trợ Socket.IO, ứng dụng vẫn hoạt động bình thường nhưng không có realtime updates
- Password của proxy được gửi raw sang API (backend sẽ encrypt)
- Fingerprints sử dụng JSON editor với validation
- Nếu backend không có endpoint `/api/fingerprints`, UI sẽ hiển thị cảnh báo
- Nếu backend không có endpoint `/api/job-executions`, UI sẽ hiển thị cảnh báo

