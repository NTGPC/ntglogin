import { launchBrowserWithProfile } from '../workflow/chromeLauncher';
import axios from "axios";
import { runWorkflowSteps } from "../workflow/runner";

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000';

type StartJobData = {
  profileId: number;
  executablePath: string;     // đường dẫn Chrome/Orbita
  userDataDir: string;        // folder profile (tự build theo DB)
  proxy?: { host: string; port: number; username?: string; password?: string };
  workflowId?: number;        // optional: id workflow để chạy ngay
  vars?: Record<string, any>; // { email, password, ... }
};

export default async function profileStartProcessor(job: { data: StartJobData }) {
  const { profileId, executablePath, userDataDir, proxy, workflowId, vars } = job.data;

  console.log(`🔄 [ProfileStart] Starting profile ${profileId}`);

  // Fetch profile from DB to get proxy, userAgent, and userDataDir
  let profile: any;
  try {
    const profileResponse = await axios.get(`${BACKEND_URL}/api/profiles/${profileId}`);
    profile = profileResponse.data.data || profileResponse.data;
    console.log(`✅ [ProfileStart] Fetched profile ${profileId}`);
  } catch (err: any) {
    console.error(`❌ [ProfileStart] Failed to fetch profile:`, err?.message);
    throw new Error(`Failed to fetch profile: ${err?.message}`);
  }

  // Lấy proxy từ DB -> map về dạng ProxyConfig
  const proxyConfig = profile?.proxy
    ? {
        host: profile.proxy.host,
        port: profile.proxy.port,
        username: profile.proxy.username || undefined,
        password: profile.proxy.password || undefined,
      }
    : proxy || undefined; // Fallback to proxy from job.data if profile doesn't have proxy

  // Path thư mục profile (tùy bạn lưu chỗ nào)
  const profileUserDataDir = userDataDir || profile.userDataDir || `./browser_profiles/profile_${profileId}`;

  // Launch browser with profile
  let context;
  let page;
  try {
    const { context: browserContext } = await launchBrowserWithProfile(
      profileUserDataDir,
      proxyConfig,
      profile.user_agent || profile.userAgent
    );
    context = browserContext;

    // Nếu bạn cần expose wsEndpoint/port để debug, có thể lấy từ context.browser()
    const browser = context.browser(); // Browser | null

    // Tạo page mới để điều khiển
    page = await context.newPage();
    await page.bringToFront();
    console.log(`✅ [ProfileStart] Browser launched with persistent context`);
  } catch (err: any) {
    console.error(`❌ [ProfileStart] Failed to launch browser:`, err?.message);
    throw new Error(`Failed to launch browser: ${err?.message}`);
  }

  // 2) Lưu session vào DB (để UI theo dõi)
  let session: any;
  try {
    // Try to get wsEndpoint from browser if available
    const browser = context.browser();
    let wsEndpoint: string | undefined;
    let devtoolsPort: number | undefined;

    if (browser) {
      // Try to extract wsEndpoint from browser (Playwright may not expose this directly)
      // For now, we'll just note that browser is connected
      console.log(`✅ [ProfileStart] Browser connected via Playwright`);
    }

    const sessionResponse = await axios.post(`${BACKEND_URL}/api/sessions`, {
      profile_id: profileId,
      status: "running",
      meta: {
        devtoolsPort,
        wsEndpoint,
        launchedViaPlaywright: true,
      },
    });
    session = sessionResponse.data.data || sessionResponse.data;
    console.log(`✅ [ProfileStart] Session created: ${session.id}`);
  } catch (err: any) {
    console.error(`❌ [ProfileStart] Failed to create session:`, err?.message);
    // Close browser context if session creation fails
    try {
      await context.close();
    } catch (closeErr) {
      console.warn(`⚠️ [ProfileStart] Failed to close context:`, closeErr);
    }
    throw new Error(`Failed to create session: ${err?.message}`);
  }

  try {

    // 4) Nếu có workflow → chạy
    if (workflowId) {
      console.log(`🔄 [ProfileStart] Running workflow ${workflowId}...`);
      try {
        await runWorkflowSteps(workflowId, page, vars ?? {});
        console.log(`✅ [ProfileStart] Workflow ${workflowId} completed successfully`);
      } catch (workflowErr: any) {
        console.error(`❌ [ProfileStart] Workflow execution failed:`, workflowErr?.message);
        console.error(`❌ [ProfileStart] Workflow error stack:`, workflowErr?.stack);
        // Don't throw - continue with session running
        // Workflow errors are logged but don't stop the session
      }
    }

    // Update session status to IDLE (workflow completed, browser still running)
    try {
      await axios.put(`${BACKEND_URL}/api/sessions/${session.id}`, {
        status: "running", // Keep as running since browser is still open
        meta: {
          ...(session.meta || {}),
          workflowId: workflowId || null,
          workflowCompleted: !!workflowId,
        },
      });
      console.log(`✅ [ProfileStart] Session updated to IDLE`);
    } catch (updateErr: any) {
      console.warn(`⚠️ [ProfileStart] Failed to update session:`, updateErr?.message);
    }

    // đừng close browser nếu bạn muốn giữ phiên mở cho user
    // await browser.close(); // chỉ close khi stop profile
    
    return {
      success: true,
      sessionId: session.id,
      wsEndpoint: undefined, // Playwright persistent context doesn't expose wsEndpoint the same way
      port: undefined,
    };
  } catch (err: any) {
    console.error(`❌ [ProfileStart] Error:`, err?.message || err);
    console.error(`❌ [ProfileStart] Error stack:`, err?.stack);

    // Update session status to ERROR
    if (session?.id) {
      try {
        await axios.put(`${BACKEND_URL}/api/sessions/${session.id}`, {
          status: "failed",
          meta: {
            ...(session.meta || {}),
            error: String(err?.message || err),
          },
        });
      } catch (updateErr: any) {
        console.error(`❌ [ProfileStart] Failed to update session error:`, updateErr?.message);
      }
    }

    // Close browser context
    try {
      if (context) {
        await context.close();
      }
    } catch (closeErr) {
      console.warn(`⚠️ [ProfileStart] Failed to close context:`, closeErr);
    }

    throw err;
  }
}

