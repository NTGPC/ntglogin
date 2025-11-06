import { spawn, SpawnOptions } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";
import getPort from "get-port";

export type LaunchChromeOpts = {
  executablePath: string;          // đường dẫn chrome/orbita của bạn
  userDataDir: string;             // folder profile (đang dùng)
  proxy?: { host: string; port: number; username?: string; password?: string };
  extraArgs?: string[];
};

export type ChromeHandle = {
  pid: number;
  port: number;              // remote debugging port
  wsEndpoint: string;        // ws://127.0.0.1:port/devtools/browser/...
  kill: () => void;
};

/** đợi endpoint DevTools sẵn sàng */
async function waitForDevtools(port: number, timeoutMs = 15000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const getJson = (path: string) =>
    new Promise<string>((resolve, reject) => {
      const req = http.get({ host: "127.0.0.1", port, path }, (res) => {
        if (res.statusCode && res.statusCode >= 400) return reject(new Error("DevTools http " + res.statusCode));
        let data = ""; res.on("data", d => data += d); res.on("end", () => resolve(data));
      });
      req.on("error", reject);
    });

  while (Date.now() < deadline) {
    try {
      const txt = await getJson("/json/version");
      const json = JSON.parse(txt);
      if (json.webSocketDebuggerUrl) return json.webSocketDebuggerUrl;
    } catch {}
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error("Timeout waitForDevtools");
}

/** khi dùng --remote-debugging-port=0, Chrome ghi file DevToolsActivePort trong userDataDir */
function readDevtoolsActivePort(userDataDir: string): number | null {
  try {
    const p = path.join(userDataDir, "DevToolsActivePort");
    const s = fs.readFileSync(p, "utf8").trim();
    const line = s.split("\n")[0];            // dòng đầu là port
    const port = parseInt(line, 10);
    return Number.isFinite(port) ? port : null;
  } catch { return null; }
}

export async function launchChrome(opts: LaunchChromeOpts): Promise<ChromeHandle> {
  // Find an available port in range 9222-9550
  let port = 9222;
  let found = false;
  for (let p = 9222; p <= 9550; p++) {
    const available = await getPort({ port: p });
    if (available === p) {
      port = p;
      found = true;
      break;
    }
  }
  if (!found) {
    port = await getPort(); // Fallback to any available port
  }

  const args = [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${opts.userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--disable-features=Translate,ExtensionsToolbarMenu",
    "--disable-popup-blocking",
    "--disable-sync",
    "--disable-plugins",
    "--disable-features=AutomationControlled",
    "--lang=en-US",
    ...(opts.extraArgs ?? []),
  ];

  if (opts.proxy?.host) {
    args.push(`--proxy-server=${opts.proxy.host}:${opts.proxy.port}`);
  }

  const spawnOpts: SpawnOptions = { detached: true, stdio: "ignore" };
  const child = spawn(opts.executablePath, args, spawnOpts);
  child.unref();

  // chờ DevTools sẵn sàng
  let wsEndpoint: string | undefined;
  try {
    wsEndpoint = await waitForDevtools(port, 15000);
  } catch {
    // fallback khi port=0 hoặc chậm: đọc file DevToolsActivePort
    const p = readDevtoolsActivePort(opts.userDataDir);
    if (!p) throw new Error("Cannot get DevTools endpoint/port");
    const epTxt = await waitForDevtools(p, 10000);
    wsEndpoint = epTxt;
  }

  return {
    pid: child.pid ?? -1,
    port,
    wsEndpoint: wsEndpoint!,
    kill: () => { try { process.kill(child.pid!, 'SIGTERM'); } catch {} },
  };
}

