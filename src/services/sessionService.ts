import prisma from '../prismaClient';
import { launchBrowser, closeBrowser } from './browserService';

export const getAllSessions = async () => {
  return prisma.session.findMany({
    include: {
      profile: true,
      proxy: true,
    },
  });
};

export const getSessionById = async (id: number) => {
  return prisma.session.findUnique({
    where: { id },
    include: {
      profile: true,
      proxy: true,
    },
  });
};

export const createSession = async (data: {
  profile_id: number;
  proxy_id?: number;
  status?: string;
  meta?: any;
}) => {
  // Get profile and proxy data
  const profile = await prisma.profile.findUnique({
    where: { id: data.profile_id },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  let proxy = null;
  let validProxyId: number | null = null;
  
  if (data.proxy_id) {
    proxy = await prisma.proxy.findUnique({
      where: { id: data.proxy_id },
    });
    if (proxy) {
      validProxyId = data.proxy_id;
    } else {
      console.warn(`[Session] Proxy ID ${data.proxy_id} not found, creating session without proxy`);
    }
  }

  // Create session - only include proxy_id if it's valid
  const sessionData: any = {
    profile_id: data.profile_id,
    status: data.status || 'running',
    started_at: new Date(),
  };
  
  // Only set proxy_id if we have a valid proxy
  if (validProxyId !== null) {
    sessionData.proxy_id = validProxyId;
  }
  
  // Include meta if provided
  if (data.meta) {
    sessionData.meta = data.meta;
  }

  const session = await prisma.session.create({
    data: sessionData,
    include: {
      profile: true,
      proxy: true,
    },
  });

  // Check for existing running sessions for this profile and close their browsers
  const existingSessions = await prisma.session.findMany({
    where: {
      profile_id: profile.id,
      status: 'running',
      id: { not: session.id }, // Exclude current session
    },
  });

  // Close browsers for existing sessions
  if (existingSessions.length > 0) {
    const { closeBrowser } = await import('./browserService');
    for (const existingSession of existingSessions) {
      try {
        await closeBrowser(existingSession.id);
        // Update session status to stopped
        await prisma.session.update({
          where: { id: existingSession.id },
          data: { status: 'stopped', stopped_at: new Date() },
        });
        console.log(`⚠️ [Session ${session.id}] Closed existing session ${existingSession.id} for profile ${profile.id}`);
      } catch (err) {
        console.warn(`⚠️ [Session ${session.id}] Failed to close existing session ${existingSession.id}:`, err);
      }
    }
  }

  // Launch browser - try to use Python worker via HTTP if available, otherwise use local Puppeteer
  try {
    // Build proxy config
    const proxyConfig = proxy
      ? {
          host: proxy.host,
          port: proxy.port,
          username: proxy.username || undefined,
          password: proxy.password || undefined,
          type: proxy.type,
        }
      : undefined;

    const USE_PY_WORKER = String(process.env.USE_PY_WORKER || '').toLowerCase() === 'true';
    if (USE_PY_WORKER) {
      // Try to use Python worker first when explicitly enabled
      const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://127.0.0.1:8000';
      try {
        const axios = (await import('axios')).default;
        await axios.post(
          `${PYTHON_API_URL}/api/sessions`,
          {
            profile_id: profile.id,
            proxy_id: data.proxy_id,
          },
          { timeout: 5000 }
        );
        console.log(`✅ [Session ${session.id}] Session created via Python worker for profile ${profile.id}`);
        // Session already created by Python worker, just return the session we created
        return session;
      } catch (pythonError: any) {
        console.warn(`⚠️ Python worker not available (${pythonError?.message}), falling back to local Puppeteer...`);
      }
    }

    // Default: use local Puppeteer (ensures proxy username/password are applied)
    await launchBrowser({
      profileId: profile.id,
      sessionId: session.id,
      userAgent: profile.user_agent || undefined,
      fingerprint: profile.fingerprint as any || undefined,
      proxy: proxyConfig,
    });

    console.log(`✅ [Session ${session.id}] Browser launched successfully for profile ${profile.id}`);
  } catch (error: any) {
    console.error(`❌ [Session ${session.id}] Failed to launch browser:`, error);
    const errorMessage = error?.message || String(error);
    // Update session status to failed
    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'failed', meta: { error: errorMessage } },
    });
    // Re-throw with more context
    throw new Error(`Failed to start session: ${errorMessage}`);
  }

  return session;
};

export const updateSession = async (
  id: number,
  data: {
    status?: string;
    started_at?: Date;
    stopped_at?: Date;
    meta?: any;
  }
) => {
  // If status is stopped, close browser
  if (data.status === 'stopped') {
    try {
      await closeBrowser(id);
      console.log(`✅ [Session ${id}] Browser closed`);
    } catch (error) {
      console.error(`❌ [Session ${id}] Failed to close browser:`, error);
    }
  }

  return prisma.session.update({
    where: { id },
    data,
    include: {
      profile: true,
      proxy: true,
    },
  });
};

export const deleteSession = async (id: number) => {
  // Close browser before deleting session
  try {
    await closeBrowser(id);
  } catch (error) {
    console.error(`Failed to close browser for session ${id}:`, error);
  }

  return prisma.session.delete({
    where: { id },
  });
};

export const getSessionsByProfile = async (profileId: number) => {
  return prisma.session.findMany({
    where: { profile_id: profileId },
    include: {
      proxy: true,
    },
  });
};

export const updateProfileFingerprint = async (profileId: number, patch: any) => {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } })
  const current: any = (profile as any)?.fingerprint || {}
  const next = { ...current, ...patch }
  await prisma.profile.update({ where: { id: profileId }, data: { fingerprint: next } })
  return next
}

