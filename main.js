const { app, BrowserWindow, ipcMain, dialog } = require('electron'); // Đã thêm dialog
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// --- CẤU HÌNH THƯ VIỆN ĐỒ HỌA ---
// Nếu chưa cài canvas thì nó sẽ bỏ qua để không crash app
let createCanvas, loadImage, registerFont;
try {
  const canvasModule = require('canvas');
  createCanvas = canvasModule.createCanvas;
  loadImage = canvasModule.loadImage;
  registerFont = canvasModule.registerFont;
} catch (e) {
  console.warn('[WARNING] Chưa cài thư viện canvas. Chức năng tạo ảnh sẽ lỗi.');
}

// --- CẤU HÌNH BCRYPT & PRISMA ---
const bcrypt = require('bcryptjs'); // Dùng bcryptjs cho nhẹ và không lỗi build

// Khởi tạo Prisma Client
let prisma = null;
async function getPrisma() {
  if (!prisma) {
    const { PrismaClient } = require('@prisma/client');
    prisma = new PrismaClient();
  }
  return prisma;
}

// Kích hoạt Stealth mode cho nuôi nick
chromium.use(stealth);

// --- BIẾN TOÀN CỤC ---
const activeBrowsers = new Map();

// --- CẤU HÌNH PATH ---
const FFMPEG_PATH = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
const ROOT_DIR = app.getAppPath().replace('app.asar', '').replace(/\\resources$/, '');
const OUTPUT_FOLDER_DEFAULT = 'D:\\render_output';

// Helper: Tạo các folder cần thiết
['font', 'temp', 'title', 'png'].forEach(folder => {
  const p = path.join(ROOT_DIR, folder);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// =========================================================
// 1. KHỞI TẠO CỬA SỔ
// =========================================================
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });


// =========================================================
// 2. MODULE VIDEO EDITOR (CORE LOGIC)
// =========================================================

// --- A. XỬ LÝ DIALOG (CHỌN FILE/FOLDER) ---
ipcMain.handle('dialog:openFolder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] });
  return canceled ? null : filePaths[0];
});

ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg'] }]
  });
  return canceled ? null : filePaths[0];
});

// --- B. QUÉT VIDEO (SCAN) ---
ipcMain.handle('video:scan', async (event, folderPath) => {
  console.log('[SCAN] Đang quét folder:', folderPath);
  if (!fs.existsSync(folderPath)) return [];

  try {
    const files = fs.readdirSync(folderPath);
    // Lọc lỏng hơn để bắt được cả .MP4, .Mp4...
    const videos = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return ['.mp4', '.mov', '.avi', '.mkv'].includes(ext);
    }).map((name, index) => ({
      id: index + 1,
      name: name,
      path: path.join(folderPath, name),
      txtPath: null,
      pngPath: null,
      status: 'pending'
    }));

    console.log(`[SCAN] Tìm thấy ${videos.length} video.`);
    return videos;
  } catch (error) {
    console.error('[SCAN ERROR]', error);
    return [];
  }
});

// --- C. LẤY DANH SÁCH FONT ---
ipcMain.handle('video:getFonts', async () => {
  const fontDir = path.join(ROOT_DIR, 'font');
  if (!fs.existsSync(fontDir)) return [];
  return fs.readdirSync(fontDir).filter(f => f.endsWith('.ttf') || f.endsWith('.otf'));
});

// --- D. XỬ LÝ TITLE (RENAME & GEN TXT) ---
ipcMain.handle('video:processTitle', async (event, config) => {
  const { videoPath, removeSpaces, removeHashtag, deleteChars, prefix, suffix } = config;
  const dir = path.dirname(videoPath);
  const ext = path.extname(videoPath);
  let oldName = path.basename(videoPath, ext);

  let newName = oldName;

  if (removeHashtag) newName = newName.replace(/#\S+/g, '');
  if (removeSpaces) newName = newName.replace(/\s\s+/g, ' ');
  if (deleteChars) {
    const chars = deleteChars.split(' ').filter(c => c).map(c => '\\' + c).join('|');
    if (chars) newName = newName.replace(new RegExp(chars, 'g'), '');
  }
  newName = newName.trim();
  if (prefix) newName = `${prefix}${newName}`;
  if (suffix) newName = `${suffix}${newName}`;

  const newVideoPath = path.join(dir, newName + ext);
  const txtPath = path.join(ROOT_DIR, 'title', `${newName}.txt`);

  try {
    if (videoPath !== newVideoPath) fs.renameSync(videoPath, newVideoPath);
    fs.writeFileSync(txtPath, newName, 'utf8');
    return { success: true, newPath: newVideoPath, newName: newName + ext, txtPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// --- E. TẠO ẢNH PNG (CANVAS) ---
ipcMain.handle('video:createPng', async (event, config) => {
  if (!createCanvas) return { success: false, error: 'Chưa cài module canvas!' };
  try {
    const { txtPath, bgPath, fontName, color, size, borderInfo, isUpperCase, isFirstLetter } = config;
    let text = fs.readFileSync(txtPath, 'utf8').trim();

    if (isUpperCase) text = text.toUpperCase();
    if (isFirstLetter) text = text.toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase());

    const image = await loadImage(bgPath);
    const canvas = createCanvas(1080, 1920);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0, 1080, 1920);

    const fontPath = path.join(ROOT_DIR, 'font', fontName);
    if (fs.existsSync(fontPath)) registerFont(fontPath, { family: 'CustomFont' });

    ctx.font = `${size}px "CustomFont"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const x = 1080 / 2;
    const y = 1920 / 2;

    if (borderInfo && borderInfo.size > 0) {
      ctx.strokeStyle = borderInfo.color || 'black';
      ctx.lineWidth = Number(borderInfo.size);
      ctx.strokeText(text, x, y);
    }

    ctx.fillStyle = color || 'black';
    ctx.fillText(text, x, y);

    const fileName = path.basename(txtPath, '.txt') + '.png';
    const outPath = path.join(ROOT_DIR, 'png', fileName);
    fs.writeFileSync(outPath, canvas.toBuffer('image/png'));

    return { success: true, pngPath: outPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// --- F. RENDER VIDEO (FFMPEG) ---
ipcMain.on('video:render', (event, config) => {
  const { videoPath, pngPath, outputFolder } = config;
  const fileName = path.basename(videoPath);
  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder, { recursive: true });
  const outputPath = path.join(outputFolder, fileName);

  console.log(`[FFmpeg] Rendering: ${fileName}`);

  const args = [
    '-y', '-i', videoPath, '-i', pngPath,
    '-filter_complex', '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg];[bg][1:v]overlay=0:0',
    '-c:v', 'libx264', '-preset', 'ultrafast',
    outputPath
  ];

  const ffmpeg = spawn(FFMPEG_PATH, args);
  let duration = 0;

  ffmpeg.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Duration:')) {
      const m = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
      if (m) duration = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
    }
    if (output.includes('time=')) {
      const m = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
      if (m && duration > 0) {
        const t = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseInt(m[3]);
        const pct = Math.round((t / duration) * 100);
        event.sender.send('video:progress', { fileName, percent: pct });
      }
    }
  });

  ffmpeg.on('close', (code) => {
    if (code === 0) event.sender.send('video:complete', { fileName });
    else event.sender.send('video:error', { fileName, error: `Code ${code}` });
  });
});


// =========================================================
// 3. MODULE USER MANAGEMENT (DATABASE SQLITE)
// =========================================================

// A. LẤY DANH SÁCH
ipcMain.handle('user:getAll', async () => {
  try {
    const db = await getPrisma();
    const users = await db.user.findMany({ orderBy: { createdAt: 'desc' } });
    return { success: true, data: users };
  } catch (e) { return { success: false, error: e.message }; }
});

// B. TẠO USER
ipcMain.handle('user:create', async (event, userData) => {
  try {
    const db = await getPrisma();
    const { username, password, fullName, role, avatarConfig } = userData;
    const exist = await db.user.findUnique({ where: { username } });
    if (exist) return { success: false, error: 'Username đã tồn tại' };

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName,
        role,
        avatar: JSON.stringify(avatarConfig)
      }
    });
    return { success: true, data: newUser };
  } catch (e) { return { success: false, error: e.message }; }
});

// C. XÓA USER
ipcMain.handle('user:delete', async (event, id) => {
  try {
    const db = await getPrisma();
    await db.user.delete({ where: { id: Number(id) } });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

// D. CẬP NHẬT THÔNG TIN
ipcMain.handle('user:update', async (event, { id, fullName, role, avatarConfig }) => {
  try {
    const db = await getPrisma();
    const updated = await db.user.update({
      where: { id: Number(id) },
      data: {
        fullName,
        role,
        avatar: JSON.stringify(avatarConfig)
      }
    });
    return { success: true, data: updated };
  } catch (e) { return { success: false, error: e.message }; }
});

// E. ĐỔI MẬT KHẨU (FIX LỖI)
ipcMain.handle('user:changePassword', async (event, { id, newPassword }) => {
  console.log(`[AUTH] Yêu cầu đổi pass cho ID: ${id}`); // Log để debug
  try {
    const db = await getPrisma();

    // 1. Mã hóa pass mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 2. Update vào DB (Ép kiểu Number cho ID)
    await db.user.update({
      where: { id: Number(id) },
      data: { password: hashedPassword }
    });

    console.log(`[AUTH] Đã đổi pass thành công cho ID: ${id}`);
    return { success: true };
  } catch (e) {
    console.error('[AUTH ERROR]', e);
    return { success: false, error: e.message };
  }
});

// F. ĐĂNG NHẬP
ipcMain.handle('auth:login', async (event, { username, password }) => {
  try {
    const db = await getPrisma();
    const user = await db.user.findUnique({ where: { username } });

    if (!user) return { success: false, error: 'Tài khoản không tồn tại' };

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return { success: false, error: 'Sai mật khẩu' };

    const { password: _, ...userInfo } = user;
    return { success: true, user: userInfo };
  } catch (e) { return { success: false, error: e.message }; }
});
