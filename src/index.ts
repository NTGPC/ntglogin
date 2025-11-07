import express, { Application } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import routes from './routes';
import { errorHandler } from './utils/errorHandler';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5175', 'http://127.0.0.1:5175', 'http://localhost:5177', 'http://127.0.0.1:5177'],
  credentials: true,
}));
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // HTTP request logger

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

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📚 API documentation: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;

