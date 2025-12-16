import { Router } from 'express';
import prisma from '../prismaClient';
import authRoutes from './authRoutes';
import profileRoutes from './profileRoutes';
import proxyRoutes from './proxyRoutes';
import sessionRoutes from './sessionRoutes';
import jobRoutes from './jobRoutes';
import jobExecutionRoutes from './jobExecutionRoutes';
import logRoutes from './logRoutes';
import fingerprintRoutes from './fingerprintRoutes';
import workflowRoutes from './workflowRoutes';
import workflowsRouter from './workflows.routes';
import insightsRoutes from '../insights/insights.routes';
import changelogRoutes from './changelogRoutes';
import gpuRoutes from './gpuRoutes';
import userAgentLibraryRoutes from './userAgentLibraryRoutes';
import userAgentRoutes from './userAgentRoutes';
import webglRendererRoutes from './webglRendererRoutes';
import fingerprintPresetRoutes from './fingerprintPresetRoutes';
import socialRoutes from './socialRoutes';
import analyticsRoutes from './analyticsRoutes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes (require authentication)
// Default: skip auth for development. Set REQUIRE_AUTH=true to enable authentication
const enableAuth = process.env.REQUIRE_AUTH === 'true';
const requireAuth = enableAuth
  ? authenticate // Use auth
  : (_req: any, _res: any, next: any) => next(); // Skip auth (development mode)

router.use('/profiles', requireAuth, profileRoutes);
router.use('/fingerprint-presets', requireAuth, fingerprintPresetRoutes);
router.use('/proxies', requireAuth, proxyRoutes);
router.use('/sessions', requireAuth, sessionRoutes);
router.use('/jobs', requireAuth, jobRoutes);
router.use('/job-executions', requireAuth, jobExecutionRoutes);
router.use('/logs', requireAuth, logRoutes);
router.use('/fingerprints', requireAuth, fingerprintRoutes);
router.use('/workflows', requireAuth, workflowRoutes);
router.use('/', requireAuth, workflowsRouter);
router.use('/insights', insightsRoutes);
router.use('/changelogs', requireAuth, changelogRoutes);
router.use('/gpus', gpuRoutes);
router.use('/user-agents', userAgentLibraryRoutes); // Legacy route
router.use('/user-agents-library', requireAuth, userAgentRoutes); // New CRUD route for UserAgent library
router.use('/webgl-renderers', requireAuth, webglRendererRoutes); // New CRUD route for WebGL Renderer library
router.use('/social', requireAuth, socialRoutes); // Social Analytics (Content Hunter) - Legacy
router.use('/analytics', analyticsRoutes); // Analytics Sessions (New Project-based system)

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stats endpoint for dashboard
router.get('/stats', async (_req, res) => {
  try {
    // Tạm thời trả về số liệu 0 để test kết nối Database SQLite
    res.json({
      success: true,
      data: { profiles: 0, proxies: 0, sessions: 0, jobs: 0 },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load stats', error: error?.message || String(error) });
  }
});

export default router;

