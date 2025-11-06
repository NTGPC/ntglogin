# 🚀 Cách chạy Frontend App

## Đã tạo xong!

Frontend React app đã được tạo với đầy đủ tính năng.

## Chạy ứng dụng:

```bash
cd packages/frontend
npm run dev
```

App sẽ chạy tại: **http://localhost:5173**

## Tính năng:

✅ **Login/Logout** - Đăng nhập với username/password  
✅ **Dashboard** - Hiển thị thống kê (profiles, proxies, sessions, jobs)  
✅ **Profiles** - Quản lý browser profiles (tạo, xem, xóa)  
✅ **Proxies** - Quản lý proxy servers (tạo, xem, xóa)  
✅ **Sessions** - Xem và quản lý sessions  
✅ **Jobs** - Xem danh sách jobs  

## Đăng nhập:

- Username: `admin`
- Password: `admin123`

(hoặc tài khoản bạn đã tạo trong database)

## Lưu ý:

- Đảm bảo Python backend đang chạy tại `http://localhost:3000`
- Frontend tự động gọi API backend
- Nếu backend chưa chạy, frontend sẽ báo lỗi khi đăng nhập

## Mở trình duyệt:

Sau khi chạy `npm run dev`, mở:
```
http://localhost:5173
```

