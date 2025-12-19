import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import fs from 'fs';
import path from 'path';
import routes from './routes';
import editorRoutes from './routes/editorRoutes';
import { errorHandler } from './utils/errorHandler';
import { loadGPUData } from './services/gpuService';
import { loadUserAgentLibrary } from './services/userAgentLibraryService';

import * as authController from './controllers/auth.controller';
import { initAdminAccount } from './services/auth.service';

// Load environment variables
dotenv.config();

// Load data on server startup
loadGPUData();
loadUserAgentLibrary();

// Initialize Admin Account
initAdminAccount();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5177', 'http://127.0.0.1:5177'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies with larger limit
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

// Request logging middleware for debugging
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    console.log(`[${req.method}] ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params,
    });
  }
  next();
});

// Auth Routes
// import * as authController from './controllers/auth.controller'; // REMOVE DUPLICATE
import * as dashboardController from './controllers/dashboard.controller'; // Import mới
import * as autoReelsService from './services/autoReels.service';

app.post('/api/login', authController.login);
app.get('/api/users', authController.getUsers);
app.post('/api/users', authController.createUser);
app.put('/api/users/:id', authController.updateUser);
app.put('/api/users/:id/password', authController.resetPassword);
app.delete('/api/users/:id', authController.deleteUser);

// Dashboard Routes
app.get('/api/dashboard/stats', dashboardController.getStats);

// Auto Reels Routes

// 1. API Quét file MP4 trong thư mục
app.post('/api/reels/scan-folder', (req, res) => {
  const { folderPath } = req.body;
  try {
    if (!fs.existsSync(folderPath)) return res.status(400).json({ error: "Thư mục không tồn tại" });

    const files = fs.readdirSync(folderPath)
      .filter(file => file.toLowerCase().endsWith('.mp4'))
      .map((file, index) => ({
        id: index + 1,
        name: file,
        fullPath: path.join(folderPath, file),
        status: 'Waiting'
      }));
    res.json({ files });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// API Lấy danh sách Font
app.get('/api/reels/fonts', (req, res) => {
  try {
    let fontsDir = path.join(__dirname, '../../font'); // Thử folder không 's' trước
    if (!fs.existsSync(fontsDir)) fontsDir = path.join(__dirname, '../../fonts'); // Thử có 's'

    if (!fs.existsSync(fontsDir)) return res.json({ fonts: [] });

    const files = fs.readdirSync(fontsDir)
      .filter(file => file.endsWith('.ttf') || file.endsWith('.otf'))
      .map(file => ({ name: file, path: path.join(fontsDir, file) }));
    res.json({ fonts: files });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// --- API QUÉT ẢNH TRONG THƯ MỤC LOGO ---
app.get('/api/reels/frames', (req, res) => {
  try {
    // Cố gắng tìm folder logo ở 2 vị trí:
    // 1. Ngang hàng với thư mục backend (khi chạy dev)
    // 2. Ở thư mục gốc dự án

    let logosDir = path.join(__dirname, '../../logo'); // Thử ra ngoài 2 cấp

    // Nếu không thấy, thử tìm ở gốc ổ đĩa (D:\NTGLOGIN\logo)
    // Mẹo: Dùng process.cwd() để lấy thư mục gốc nơi chạy lệnh npm run web
    if (!fs.existsSync(logosDir)) {
      logosDir = path.join(process.cwd(), 'logo');
    }

    console.log("Đang quét logo tại:", logosDir); // Log ra để debug

    if (!fs.existsSync(logosDir)) {
      // Tự tạo folder logo nếu chưa có
      fs.mkdirSync(logosDir, { recursive: true });
      return res.json({ frames: [] });
    }

    const files = fs.readdirSync(logosDir)
      .filter(file => file.toLowerCase().endsWith('.png'))
      .map(file => ({
        name: file,
        path: path.join(logosDir, file)
      }));
    res.json({ frames: files });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Biến toàn cục lưu tiến độ
let renderProgress = 0;

// 2. API Render Nâng Cao (Single video - giữ lại cho tương thích)
app.post('/api/reels/render', async (req, res) => {
  const { videoPath, framePath, text, outputDir, style } = req.body;
  try {
    console.log("Đang render:", videoPath);
    renderProgress = 0; // Reset
    const result = await autoReelsService.renderReel(
      videoPath, framePath, text, outputDir || 'D:\\NTGLOGIN\\release', style,
      (percent) => { renderProgress = percent; } // Cập nhật tiến độ
    );
    res.json({ success: true, path: result });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// 3. API Batch Render (Multiple videos)
app.post('/api/reels/start-render', async (req, res) => {
  const { videos, outputDir, useTitle, style } = req.body;
  const pngDir = path.join(process.cwd(), 'png');
  const titleDir = path.join(process.cwd(), 'title');

  // Trả về ngay để UI không bị treo
  res.json({ success: true, message: "Started" });

  try {
    renderProgress = 0;
    let completed = 0;

    for (const v of videos) {
      let outName = v.name;
      // Đọc tên từ file txt title nếu có
      if (fs.existsSync(path.join(titleDir, `${v.id}.txt`))) {
        outName = fs.readFileSync(path.join(titleDir, `${v.id}.txt`), 'utf-8');
      }

      let overlayPath = path.join(pngDir, `${v.id}.png`);
      // Nếu không dùng title hoặc file png chưa tạo -> bỏ qua overlay
      if (!useTitle || !fs.existsSync(overlayPath)) overlayPath = '';

      try {
        // Gọi hàm render mới - FIX: use v.fullPath not v.path
        await autoReelsService.renderFinalVideo(
          v.fullPath, overlayPath, outputDir || 'D:\\render_output', outName, style,
          (percent) => {
            // Tính % tổng
            const currentTotal = ((completed * 100) + percent) / videos.length;
            renderProgress = Math.min(Math.round(currentTotal), 99);
          }
        );
      } catch (err) {
        console.error(`Lỗi render video ${v.name}:`, err);
        // Vẫn tiếp tục video sau, không dừng hẳn
      }

      completed++;
      renderProgress = Math.round((completed / videos.length) * 100);
    }
    renderProgress = 100; // Xong
  } catch (e: any) {
    console.error("Lỗi hệ thống:", e);
    renderProgress = -1; // Báo lỗi Fatal
  }
});

// API lấy tiến độ (Frontend sẽ gọi liên tục cái này)
app.get('/api/reels/progress', (req, res) => {
  res.json({ progress: renderProgress });
});



// Routes
app.use('/api', routes);
app.use('/api/editor', editorRoutes);

// --- CẤU HÌNH STREAM FILES (QUAN TRỌNG) ---
// Frontend sẽ gọi: http://localhost:3000/stream/video/abc.mp4
app.use('/stream/video', express.static('D:\\NTG_Studio\\Videos'));
app.use('/stream/audio', express.static('D:\\NTG_Studio\\Audios'));

// Diagnostics static page
app.get('/diagnostics', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
  <html><head><title>Diagnostics</title><style>body{font-family:system-ui,Segoe UI,Roboto,Arial;padding:20px;line-height:1.5}</style></head>
  <body>
  <h1>Diagnostics</h1>
  <pre id="out">Loading...</pre>
  <script>
  (async function(){
    const out = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      devicePixelRatio: window.devicePixelRatio,
      screen: { width: screen.width, height: screen.height, availWidth: screen.availWidth, availHeight: screen.availHeight },
      colorScheme: window.matchMedia && (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
      reducedMotion: window.matchMedia && (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'no-preference'),
      geolocation: null
    };
    try {
      if (navigator.geolocation) {
        out.geolocation = await new Promise((resolve)=>navigator.geolocation.getCurrentPosition(p=>resolve({lat:p.coords.latitude,lon:p.coords.longitude,accuracy:p.coords.accuracy}), ()=>resolve('denied')))
      }
    } catch {}
    document.getElementById('out').textContent = JSON.stringify(out,null,2);
  })();
  </script>
  </body></html>`);
});

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'NTG Login API Server',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      profiles: '/api/profiles',
      proxies: '/api/proxies',
      sessions: '/api/sessions',
      jobs: '/api/jobs',
      logs: '/api/logs',
    },
  });
});

// ==========================================================
// === HẦM TRÚ ẨN: GLOBAL EXCEPTION HANDLER ===
// ==========================================================
// Bắt tất cả các lỗi không được xử lý để tránh crash server
process.on('uncaughtException', (error: Error) => {
  console.error('================================');
  console.error('[UNCAUGHT EXCEPTION] Server đang bị crash!');
  console.error('[UNCAUGHT EXCEPTION] Error:', error.message);
  console.error('[UNCAUGHT EXCEPTION] Stack:', error.stack);
  console.error('================================');
  // KHÔNG exit process - để server tiếp tục chạy
  // Chỉ log lỗi và tiếp tục
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('================================');
  console.error('[UNHANDLED REJECTION] Promise bị reject mà không được catch!');
  console.error('[UNHANDLED REJECTION] Reason:', reason);
  if (reason instanceof Error) {
    console.error('[UNHANDLED REJECTION] Stack:', reason.stack);
  }
  console.error('================================');
  // KHÔNG exit process - để server tiếp tục chạy
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(httpServer, {
  cors: {
    // Cho phép cả localhost và 127.0.0.1 truy cập
    origin: [
      "http://localhost:5173",
      "http://localhost:5175",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5175",
      "*" // Hoặc để dấu sao này là chấp hết mọi nguồn (Dễ chịu nhất khi dev)
    ],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Thêm dòng này cho chắc
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🛡️  Global exception handlers activated`);
  console.log(`🔌 Socket.io server initialized`);
});

export default app;

