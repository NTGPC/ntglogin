import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import routes from './routes';
import { errorHandler } from './utils/errorHandler';
import { loadGPUData } from './services/gpuService';
import { loadUserAgentLibrary } from './services/userAgentLibraryService';

// Load environment variables
dotenv.config();

// Load data on server startup
loadGPUData();
loadUserAgentLibrary();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5177', 'http://127.0.0.1:5177'],
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

// Routes
app.use('/api', routes);

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

