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
  // Get profile and proxy data (include preset relation)
  const profile = await prisma.profile.findUnique({
    where: { id: data.profile_id },
    include: {
      fingerprintPreset: true,
      userAgentRef: true,
      webglRendererRef: true,
    },
  });

  if (!profile) {
    throw new Error('Profile not found');
  }

  // NEW V2.0: Merge preset data into profile if preset exists
  let enrichedProfile: any = { ...profile };
  if (profile.fingerprintPreset) {
    const preset = profile.fingerprintPreset;
    console.log(`[Session] ✅ Merging Fingerprint Preset: ${preset.name}`);
    // Preset data takes precedence (it's the "source of truth")
    enrichedProfile = {
      ...enrichedProfile,
      userAgent: enrichedProfile.userAgent || preset.userAgent,
      platform: enrichedProfile.platform || preset.platform,
      uaPlatform: enrichedProfile.uaPlatform || preset.uaPlatform,
      uaPlatformVersion: enrichedProfile.uaPlatformVersion || preset.uaPlatformVersion,
      uaFullVersion: enrichedProfile.uaFullVersion || preset.uaFullVersion,
      uaMobile: enrichedProfile.uaMobile ?? preset.uaMobile,
      browserVersion: enrichedProfile.browserVersion || preset.browserVersion,
      hardwareConcurrency: enrichedProfile.hardwareConcurrency || preset.hardwareConcurrency,
      deviceMemory: enrichedProfile.deviceMemory || preset.deviceMemory,
      webglVendor: enrichedProfile.webglVendor || preset.webglVendor,
      webglRenderer: enrichedProfile.webglRenderer || preset.webglRenderer,
      screenWidth: enrichedProfile.screenWidth || preset.screenWidth,
      screenHeight: enrichedProfile.screenHeight || preset.screenHeight,
      colorDepth: enrichedProfile.colorDepth || preset.colorDepth,
      pixelRatio: enrichedProfile.pixelRatio || preset.pixelRatio,
      languages: enrichedProfile.languages || preset.languages,
      timezone: enrichedProfile.timezone || preset.timezone,
      canvasMode: enrichedProfile.canvasMode || preset.canvasMode,
      audioContextMode: enrichedProfile.audioContextMode || preset.audioContextMode,
      webglMetadataMode: enrichedProfile.webglMetadataMode || preset.webglMetadataMode,
      webrtcMode: enrichedProfile.webrtcMode || preset.webrtcMode,
      geolocationMode: enrichedProfile.geolocationMode || preset.geolocationMode,
      geolocationLatitude: enrichedProfile.geolocationLatitude || preset.geolocationLatitude,
      geolocationLongitude: enrichedProfile.geolocationLongitude || preset.geolocationLongitude,
      osName: enrichedProfile.osName || preset.os,
      os: enrichedProfile.os || preset.os,
    };
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

    // Build fingerprint from enriched profile data (includes preset if available)
    let fingerprint: any = enrichedProfile.fingerprintJson || enrichedProfile.fingerprint
    if (!fingerprint && (enrichedProfile.canvasMode || enrichedProfile.osName)) {
      const { build: buildFingerprint } = await import('./fingerprintService')
      fingerprint = buildFingerprint({
        osName: enrichedProfile.osName as any,
        osArch: (enrichedProfile.osArch as any) || 'x64',
        browserVersion: enrichedProfile.browserVersion || 136,
        screenWidth: enrichedProfile.screenWidth ?? 1920,
        screenHeight: enrichedProfile.screenHeight ?? 1080,
        canvasMode: (enrichedProfile.canvasMode || 'Noise') as 'Noise' | 'Off' | 'Block',
        clientRectsMode: (enrichedProfile.clientRectsMode || 'Off') as 'Off' | 'Noise',
        audioCtxMode: (enrichedProfile.audioContextMode || 'Off') as 'Off' | 'Noise',
        webglImageMode: (enrichedProfile.webglImageMode || 'Off') as 'Off' | 'Noise',
        webglMetaMode: (enrichedProfile.webglMetadataMode || 'Mask') as 'Mask' | 'Real',
        geoEnabled: enrichedProfile.geoEnabled ?? (enrichedProfile.geolocationMode === 'fake'),
        geoLatitude: enrichedProfile.geolocationLatitude || (enrichedProfile as any).geoLatitude,
        geoLongitude: enrichedProfile.geolocationLongitude || (enrichedProfile as any).geoLongitude,
        webrtcMainIP: enrichedProfile.webrtcMainIP ?? (enrichedProfile.webrtcMode === 'fake'),
        proxyRefId: enrichedProfile.proxyRefId ?? null,
        proxyManual: (enrichedProfile.proxyManual as any) ?? null,
        ua: enrichedProfile.user_agent || enrichedProfile.userAgent || '',
        mac: enrichedProfile.macAddress || '',
        timezoneId: enrichedProfile.timezone || (enrichedProfile as any).timezoneId,
        language: (enrichedProfile as any).language || (enrichedProfile.languages?.[0]),
        hardwareConcurrency: enrichedProfile.hardwareConcurrency || 8,
        deviceMemory: enrichedProfile.deviceMemory || 8,
        profileId: enrichedProfile.id,
        seed: enrichedProfile.id,
      })
    } else if (fingerprint && !fingerprint.seed) {
      // Ensure fingerprint has seed for deterministic noise
      fingerprint = {
        ...fingerprint,
        profileId: enrichedProfile.id,
        seed: fingerprint.seed || enrichedProfile.id,
      }
    }

    // NEW (Chặng 3): Try Electron first, fallback to Playwright/Puppeteer
    // Use enrichedProfile (includes preset data) instead of raw profile
    const useElectron = process.env.USE_ELECTRON !== 'false' // Default to true, can disable with USE_ELECTRON=false
    if (useElectron) {
      try {
        const { launchProfileWithElectron } = await import('./electronBrowserService')
        await launchProfileWithElectron(enrichedProfile)
        console.log(`✅ [Session ${session.id}] Browser launched via Electron for profile ${enrichedProfile.id}`)
      } catch (electronError: any) {
        console.warn(`⚠️ [Session ${session.id}] Electron launch failed, falling back to Playwright:`, electronError.message)
        // Fallback to Playwright/Puppeteer
        const { launchBrowser } = await import('./browserService')
        await launchBrowser(
          enrichedProfile,
          null,
          {
            sessionId: session.id,
            userAgent: enrichedProfile.user_agent || enrichedProfile.userAgent || undefined,
            fingerprint: fingerprint,
            proxy: proxyConfig,
          }
        )
      }
    } else {
      // Use Playwright/Puppeteer directly
      const { launchBrowser } = await import('./browserService')
      await launchBrowser(
        enrichedProfile,
        null,
        {
          sessionId: session.id,
          userAgent: enrichedProfile.user_agent || enrichedProfile.userAgent || undefined,
          fingerprint: fingerprint,
          proxy: proxyConfig,
        }
      )
    }

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

