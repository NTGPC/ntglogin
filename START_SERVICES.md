# 🚀 HƯỚNG DẪN KHỞI ĐỘNG LẠI CÁC SERVICE

## 📋 Tình trạng hiện tại:
- ✅ **Backend (port 3000)**: Đang chạy (PID: 19072)
- ❌ **Admin Web (port 5175)**: Chưa chạy (lỗi ERR_CONNECTION_REFUSED)
- ❌ **Desktop App (port 5177)**: Chưa chạy

---

## 🔧 CÁC LỆNH ĐỂ KHỞI ĐỘNG LẠI

### 1️⃣ Kiểm tra các process đang chạy

```powershell
# Kiểm tra port 3000 (Backend)
netstat -ano | findstr :3000

# Kiểm tra port 5175 (Admin Web)
netstat -ano | findstr :5175

# Kiểm tra port 5177 (Desktop)
netstat -ano | findstr :5177

# Kiểm tra tất cả Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Format-Table Id,ProcessName,Path
```

### 2️⃣ Dừng các service (nếu cần)

```powershell
# Dừng process trên port 3000 (nếu cần)
# Tìm PID từ netstat, sau đó:
taskkill /PID <PID> /F

# Hoặc dừng tất cả Node.js processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

### 3️⃣ Khởi động Backend Server

**Terminal 1:**
```powershell
cd D:\NTGLOGIN
npm run dev
```

**Kết quả mong đợi:**
```
✅ Server running on http://127.0.0.1:3000
```

### 4️⃣ Khởi động Admin Web (Frontend)

**Terminal 2 (MỚI):**
```powershell
cd D:\NTGLOGIN\packages\admin-web
npm run dev
```

**Kết quả mong đợi:**
```
✅ VITE ready in XXX ms
✅ ➜  Local:   http://localhost:5175/
```

### 5️⃣ Khởi động Desktop App (nếu cần)

**Terminal 3 (MỚI):**
```powershell
cd D:\NTGLOGIN\packages\desktop
npm run dev
```

---

## 🎯 SCRIPT TỰ ĐỘNG (Khuyến nghị)

### Windows PowerShell Script:

Tạo file `start-all.ps1`:

```powershell
# start-all.ps1
Write-Host "🚀 Starting NTGLOGIN Services..." -ForegroundColor Cyan

# Start Backend
Write-Host "`n📦 Starting Backend (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\NTGLOGIN; npm run dev" -WindowStyle Normal

# Đợi 3 giây
Start-Sleep -Seconds 3

# Start Admin Web
Write-Host "📦 Starting Admin Web (port 5175)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\NTGLOGIN\packages\admin-web; npm run dev" -WindowStyle Normal

# Đợi 2 giây
Start-Sleep -Seconds 2

Write-Host "`n✅ All services starting..." -ForegroundColor Green
Write-Host "   - Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - Admin Web: http://localhost:5175" -ForegroundColor Cyan
Write-Host "`n⚠️  Đợi vài giây để các service khởi động xong!" -ForegroundColor Yellow
```

**Chạy script:**
```powershell
.\start-all.ps1
```

---

## 🔍 DEBUG - Kiểm tra lỗi

### Kiểm tra logs Backend:
```powershell
# Xem terminal đang chạy npm run dev
# Hoặc kiểm tra:
curl http://localhost:3000/api/health
```

### Kiểm tra logs Admin Web:
```powershell
# Xem terminal đang chạy npm run dev trong packages/admin-web
# Hoặc kiểm tra:
curl http://localhost:5175
```

### Kiểm tra dependencies:
```powershell
# Kiểm tra node_modules
cd D:\NTGLOGIN
npm install

cd D:\NTGLOGIN\packages\admin-web
npm install
```

---

## 🐛 SỬA LỖI THƯỜNG GẶP

### Lỗi: "Port already in use"
```powershell
# Tìm và kill process
netstat -ano | findstr :5175
taskkill /PID <PID> /F
```

### Lỗi: "Cannot find module"
```powershell
# Cài đặt lại dependencies
cd D:\NTGLOGIN
npm install

cd D:\NTGLOGIN\packages\admin-web
npm install
```

### Lỗi: "ECONNREFUSED" khi frontend gọi API
- Kiểm tra backend đã chạy chưa: `curl http://localhost:3000/api/health`
- Kiểm tra CORS config trong `src/index.ts`
- Kiểm tra `.env` file có đúng BACKEND_URL không

---

## ✅ CHECKLIST

Sau khi chạy các lệnh, kiểm tra:

- [ ] Backend chạy trên http://localhost:3000
- [ ] Admin Web chạy trên http://localhost:5175
- [ ] Browser có thể truy cập http://localhost:5175
- [ ] Frontend có thể gọi API (kiểm tra Network tab trong DevTools)

---

## 📞 Nếu vẫn lỗi:

1. **Kiểm tra logs** trong các terminal
2. **Kiểm tra firewall** có chặn port không
3. **Kiểm tra .env** file có đúng không
4. **Restart lại** tất cả services

