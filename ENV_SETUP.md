# Environment Variables Setup

## Các biến môi trường cần thiết

Thêm các biến sau vào file `.env` của bạn:

```env
# Database
DATABASE_URL="postgresql://postgres:1593579@localhost:5432/ntglogin_db"
REDIS_URL="redis://localhost:6379"

# Server
PORT=3000
NODE_ENV=development

# JWT Authentication (Legacy - for backward compatibility)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# JWT RSA Keys (Recommended for production)
# Keys đã được tạo trong thư mục secrets/
JWT_PRIVATE_KEY_PATH=./secrets/jwt-private.pem
JWT_PUBLIC_KEY_PATH=./secrets/jwt-public.pem

# Facebook Graph API
FB_GRAPH_VERSION=v20.0
FB_CACHE_TTL_SEC=300

# Authentication (Optional)
REQUIRE_AUTH=false
```

## Tạo RSA Keys

Nếu chưa có RSA keys, chạy:

```bash
node scripts/generate-jwt-keys.js
```

Keys sẽ được tạo trong thư mục `secrets/`:
- `secrets/jwt-private.pem`
- `secrets/jwt-public.pem`

**⚠️ Lưu ý:** Không commit keys vào git! Thư mục `secrets/` đã được thêm vào `.gitignore`.

