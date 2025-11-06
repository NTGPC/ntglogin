# 📋 Cách Xem Logs

## 🔍 Logs hiển thị ở đâu?

### 1. **Console/Terminal (CHÍNH - Real-time)**
Logs hiển thị trực tiếp trong terminal nơi bạn chạy backend server.

**Cách xem:**
1. Mở terminal/PowerShell
2. Chạy backend server:
   ```powershell
   npm run dev
   ```
3. Tất cả logs sẽ hiển thị real-time trong terminal này:
   ```
   🚀 Server is running on http://localhost:3000
   🔄 [Workflow] Starting profile 1 with workflow 123
   ✅ [ProfileStart] Chrome launched, WS endpoint: ws://...
   ▶️ [WorkflowEngine] Executing node n1 (openPage)
   🌐 [WorkflowEngine] Opening page: https://www.facebook.com/login
   ✅ [WorkflowEngine] Page loaded
   ```

### 2. **Database (Qua API)**
Logs được lưu vào database, xem qua API endpoint.

**Cách xem:**
```powershell
# Xem tất cả logs (cần backend server đang chạy)
curl http://localhost:3000/api/logs

# Xem chỉ errors
curl http://localhost:3000/api/logs?level=error

# Hoặc dùng PowerShell:
Invoke-WebRequest -Uri http://localhost:3000/api/logs | Select-Object -ExpandProperty Content
```

### 3. **Database trực tiếp (PostgreSQL)**
Xem logs trong database bằng SQL:

```sql
-- Xem 100 logs mới nhất
SELECT * FROM logs ORDER BY created_at DESC LIMIT 100;

-- Xem chỉ errors
SELECT * FROM logs WHERE level = 'error' ORDER BY created_at DESC;

-- Xem logs của workflow
SELECT * FROM logs WHERE meta->>'workflowId' = '123' ORDER BY created_at DESC;
```

## 🚀 Cách Start Backend Server

### Bước 1: Kiểm tra Docker services
```powershell
docker-compose ps
```

Nếu chưa chạy:
```powershell
docker-compose up -d
```

### Bước 2: Start Backend Server
```powershell
# Development mode (auto-reload)
npm run dev

# Hoặc production mode
npm run build
npm start
```

### Bước 3: Xem logs trong terminal
Sau khi server start, bạn sẽ thấy:
```
🚀 Server is running on http://localhost:3000
📚 API documentation: http://localhost:3000/api/health
🔐 Environment: development
```

Tất cả logs từ workflow, profileStart, workflowEngine sẽ hiển thị ở đây.

## 📝 Các loại logs bạn sẽ thấy:

### Workflow Logs:
- `🔄 [Workflow] Starting processor...`
- `✅ [Workflow] Completed job...`
- `❌ [Workflow] Failed to process...`

### ProfileStart Logs:
- `🔄 [ProfileStart] Starting profile...`
- `✅ [ProfileStart] Chrome launched...`
- `✅ [ProfileStart] Attached to Chrome...`

### WorkflowEngine Logs:
- `🔄 [WorkflowEngine] Initializing...`
- `▶️ [WorkflowEngine] Executing node...`
- `🌐 [WorkflowEngine] Opening page...`
- `⌨️ [WorkflowEngine] Typing text...`
- `🖱️ [WorkflowEngine] Clicking...`

## 💡 Tips

1. **Giữ terminal mở**: Terminal nơi chạy `npm run dev` sẽ hiển thị tất cả logs
2. **Scroll để xem**: Logs sẽ scroll theo thời gian thực
3. **Filter logs**: Dùng `Ctrl+F` trong terminal để tìm logs cụ thể
4. **Export logs**: Nếu muốn lưu logs ra file, dùng:
   ```powershell
   npm run dev > logs.txt 2>&1
   ```

## ⚠️ Lưu ý

- **Backend server PHẢI đang chạy** để xem logs
- Nếu không thấy logs, kiểm tra:
  - Server đã start chưa? (`npm run dev`)
  - Port 3000 có bị chiếm không?
  - Có lỗi khi start server không?

