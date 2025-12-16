"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchProfileWindow = launchProfileWindow;
exports.closeProfileWindow = closeProfileWindow;
exports.getProfileWindow = getProfileWindow;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Initialize Electron app if not already initialized
if (!electron_1.app.isReady()) {
    electron_1.app.whenReady().then(() => {
        console.log('[Electron] App is ready');
    });
}
const profileWindows = new Map();
async function launchProfileWindow(profile) {
    // Ensure Electron app is ready
    await ensureAppReady();
    console.log(`[Electron] Launching profile ${profile.id}: ${profile.name}`);
    // Close existing window for this profile if any
    const existingWindow = profileWindows.get(profile.id);
    if (existingWindow && !existingWindow.isDestroyed()) {
        existingWindow.close();
    }
    // Create session partition for this profile (isolated storage)
    const partitionName = `persist:PROFILE${profile.id}`;
    const ses = electron_1.session.fromPartition(partitionName);
    // ==========================================================
    // === BƯỚC 2: CAN THIỆP VÀO SESSION VÀ GIAO THỨC MẠNG ===
    // ==========================================================
    // Ghi đè User-Agent và Client Hints ở tầng sâu nhất (trước khi request được gửi)
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
        const headers = details.requestHeaders || {};
        // GHI ĐÈ USER-AGENT VÀ CLIENT HINTS Ở TẦNG SÂU NHẤT
        if (profile.userAgent) {
            headers['User-Agent'] = profile.userAgent;
        }
        // Client Hints Headers (quan trọng để nhất quán)
        if (profile.uaPlatform) {
            headers['Sec-CH-UA-Platform'] = `"${profile.uaPlatform}"`;
        }
        if (profile.uaPlatformVersion) {
            headers['Sec-CH-UA-Platform-Version'] = `"${profile.uaPlatformVersion}"`;
        }
        if (profile.uaFullVersion) {
            headers['Sec-CH-UA-Full-Version'] = `"${profile.uaFullVersion}"`;
        }
        if (profile.uaMobile !== undefined) {
            headers['Sec-CH-UA-Mobile'] = profile.uaMobile ? '?1' : '?0';
        }
        // Browser brand hints
        const chromeVersion = profile.userAgent?.match(/Chrome\/(\d+)/)?.[1] || '120';
        headers['Sec-CH-UA'] = `"Not_A Brand";v="8", "Chromium";v="${chromeVersion}", "Google Chrome";v="${chromeVersion}"`;
        callback({ requestHeaders: headers });
    });
    // Configure proxy if provided
    if (profile.proxy) {
        const proxyConfig = {
            proxyRules: `${profile.proxy.type}://${profile.proxy.host}:${profile.proxy.port}`,
        };
        ses.setProxy(proxyConfig, () => {
            console.log(`[Electron] Proxy configured: ${profile.proxy?.type}://${profile.proxy?.host}:${profile.proxy?.port}`);
        });
    }
    // ==========================================================
    // === BƯỚC 3: TẠO BROWSER WINDOW VỚI PRELOAD SCRIPT ===
    // ==========================================================
    // Preload script path (compiled from TypeScript)
    const preloadPath = path.join(__dirname, 'preload.js');
    const preloadDevPath = path.join(__dirname, '../src/preload.ts');
    // Use compiled version in production, TypeScript in development
    const finalPreloadPath = fs.existsSync(preloadPath) ? preloadPath : preloadDevPath;
    const win = new electron_1.BrowserWindow({
        width: profile.screenWidth || 1920,
        height: profile.screenHeight || 1080,
        webPreferences: {
            preload: finalPreloadPath,
            partition: partitionName,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false,
            // Allow preload to access Node.js APIs
            enableRemoteModule: false,
        },
        show: false, // Don't show until ready
    });
    // Store window reference
    profileWindows.set(profile.id, win);
    // Load preload script and inject fingerprint data
    win.webContents.on('did-finish-load', () => {
        // Inject fingerprint configuration via IPC
        win.webContents.send('fingerprint-config', {
            profileId: profile.id,
            userAgent: profile.userAgent,
            platform: profile.platform,
            hardwareConcurrency: profile.hardwareConcurrency,
            deviceMemory: profile.deviceMemory,
            languages: profile.languages,
            screenWidth: profile.screenWidth,
            screenHeight: profile.screenHeight,
            colorDepth: profile.colorDepth,
            pixelRatio: profile.pixelRatio,
            webglVendor: profile.webglVendor,
            webglRenderer: profile.webglRenderer,
            canvasMode: profile.canvasMode,
            audioContextMode: profile.audioContextMode,
            webrtcMode: profile.webrtcMode,
            geolocationMode: profile.geolocationMode,
            geolocationLatitude: profile.geolocationLatitude,
            geolocationLongitude: profile.geolocationLongitude,
            timezone: profile.timezone,
        });
    });
    // Show window when ready
    win.once('ready-to-show', () => {
        win.show();
        console.log(`[Electron] ✅ Profile window ${profile.id} is ready`);
    });
    // Clean up on close
    win.on('closed', () => {
        profileWindows.delete(profile.id);
    });
    // ==========================================================
    // === BƯỚC 4: TÙY CHỈNH CÁC CỜ KHỞI CHẠY CỦA CHROMIUM ===
    // ==========================================================
    // Set Chromium command line switches
    electron_1.app.commandLine.appendSwitch('disable-blink-features', 'AutomationControlled');
    electron_1.app.commandLine.appendSwitch('disable-infobars');
    electron_1.app.commandLine.appendSwitch('no-sandbox');
    electron_1.app.commandLine.appendSwitch('disable-dev-shm-usage');
    // Language and locale
    if (profile.languages && profile.languages.length > 0) {
        electron_1.app.commandLine.appendSwitch('lang', profile.languages[0]);
    }
    // Timezone (if supported)
    if (profile.timezone) {
        // Note: Electron doesn't directly support timezone via command line
        // This will be handled by injection script
    }
    // Load initial URL (or restore session)
    win.loadURL('about:blank');
    return win;
}
function closeProfileWindow(profileId) {
    const win = profileWindows.get(profileId);
    if (win && !win.isDestroyed()) {
        win.close();
        profileWindows.delete(profileId);
        console.log(`[Electron] ✅ Closed profile window ${profileId}`);
    }
}
function getProfileWindow(profileId) {
    return profileWindows.get(profileId);
}
