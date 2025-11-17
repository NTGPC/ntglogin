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
import n8nRouter from './n8n.routes';
import insightsRoutes from '../insights/insights.routes';
import changelogRoutes from './changelogRoutes';
import gpuRoutes from './gpuRoutes';
import userAgentLibraryRoutes from './userAgentLibraryRoutes';
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
router.use('/proxies', requireAuth, proxyRoutes);
router.use('/sessions', requireAuth, sessionRoutes);
router.use('/jobs', requireAuth, jobRoutes);
router.use('/job-executions', requireAuth, jobExecutionRoutes);
router.use('/logs', requireAuth, logRoutes);
router.use('/fingerprints', requireAuth, fingerprintRoutes);
router.use('/workflows', requireAuth, workflowRoutes);
router.use('/', requireAuth, workflowsRouter);
router.use('/n8n', requireAuth, n8nRouter);
router.use('/insights', insightsRoutes);
router.use('/changelogs', requireAuth, changelogRoutes);
router.use('/gpus', gpuRoutes);
router.use('/user-agents', userAgentLibraryRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stats endpoint for dashboard
router.get('/stats', async (_req, res) => {
  try {
    const [profiles, proxies, sessions, jobs] = await Promise.all([
      prisma.profile.count(),
      prisma.proxy.count({ where: { active: true } }),
      prisma.session.count({ where: { status: 'running' } }),
      prisma.job.count(),
    ]);

    res.json({
      success: true,
      data: { profiles, proxies, sessions, jobs },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to load stats', error: error?.message || String(error) });
  }
});

export default router;

