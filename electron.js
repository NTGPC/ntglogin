const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createCanvas, registerFont } = require('canvas');

// Xác định môi trường
const isDev = !app.isPackaged;

// --- CẤU HÌNH ---
const FFMPEG_PATH = isDev ? 'C:\\ffmpeg\\bin\\ffmpeg.exe' : path.join(process.resourcesPath, 'ffmpeg.exe');
const OUTPUT_FOLDER = 'D:\\render_output';

// --- CẤU HÌNH MÔI TRƯỜNG CHO FILE .EXE ---
if (!isDev) {
    // 1. Cấu hình Database: Trỏ vào file data.db nằm cạnh file .exe
    process.env.DATABASE_URL = `file:${path.join(process.resourcesPath, 'prisma/data.db')}`;

    // 2. Cấu hình Port: Ép cứng cổng 3000
    process.env.PORT = 3000;

    // 3. Cấu hình FFmpeg (Cho Video Editor sau này)
    process.env.FFMPEG_PATH = FFMPEG_PATH;
}

// --- HÀM KHỞI ĐỘNG BACKEND ---
const startBackend = () => {
    if (isDev) {
        console.log('Chế độ Dev: Tự chạy backend bên ngoài nhé');
        return;
    }

    try {
        // Tìm file backend đã build
        const backendPath = path.join(__dirname, 'backend/dist/index.js');
        console.log('>>> Đang khởi động Backend tại:', backendPath);

        // Gọi file backend chạy
        require(backendPath);
    } catch (error) {
        console.error('!!! LỖI KHÔNG BẬT ĐƯỢC BACKEND:', error);
    }
};

// Gọi hàm khởi động ngay lập tức
startBackend();

// --- HÀM TẠO ẢNH PNG TỪ TEXT (CANVAS) ---
function generateOverlayImage(text, fontName, color, outputPath) {
    try {
        // Tạo canvas với kích thước 1080x1920 (9:16)
        const canvas = createCanvas(1080, 1920);
        const ctx = canvas.getContext('2d');

        // Nền trong suốt
        ctx.clearRect(0, 0, 1080, 1920);

        // Cấu hình font
        const fontSize = 80;
        const fontPath = path.join(__dirname, 'font', `${fontName}.ttf`);

        // Đăng ký font nếu tồn tại, nếu không dùng font mặc định
        if (fs.existsSync(fontPath)) {
            registerFont(fontPath, { family: fontName });
            ctx.font = `bold ${fontSize}px "${fontName}"`;
        } else {
            ctx.font = `bold ${fontSize}px Arial`;
        }

        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Vẽ text ở giữa màn hình
        const x = 1080 / 2;
        const y = 1920 / 2;

        // Wrap text nếu quá dài
        const maxWidth = 1000;
        const words = text.split(' ');
        let line = '';
        let lines = [];

        for (let word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line !== '') {
                lines.push(line);
                line = word + ' ';
            } else {
                line = testLine;
            }
        }
        lines.push(line);

        // Vẽ từng dòng
        const lineHeight = fontSize * 1.2;
        const startY = y - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, i) => {
            ctx.fillText(line.trim(), x, startY + (i * lineHeight));
        });

        // Lưu file PNG
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);

        console.log(`[Canvas] Đã tạo overlay image: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('[Canvas] Lỗi khi tạo overlay image:', error);
        return false;
    }
}

// --- IPC HANDLERS ---

// 1. XỬ LÝ SCAN FOLDER
ipcMain.handle('video:scan-folder', async (event, folderPath) => {
    try {
        if (!fs.existsSync(folderPath)) {
            return { success: false, error: 'Thư mục không tồn tại' };
        }

        const files = fs.readdirSync(folderPath);
        // Lọc chỉ lấy file video
        const videos = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(ext);
        });

        return { success: true, data: videos };
    } catch (error) {
        console.error('[IPC] Lỗi scan folder:', error);
        return { success: false, error: error.message };
    }
});

// 2. XỬ LÝ RENDER (CORE LOGIC)
ipcMain.on('video:start-render', async (event, config) => {
    const { fileName, folderPath, overlayText, fontName, color, options } = config;
    const inputPath = path.join(folderPath, fileName);

    // Tạo output folder nếu chưa có
    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER, { recursive: true });
    }

    const outputPath = path.join(OUTPUT_FOLDER, `edited_${fileName}`);

    console.log(`[Main] Bắt đầu render: ${fileName}`);

    // --- BƯỚC A: TẠO ẢNH PNG TỪ TEXT ---
    const tempPngPath = path.join(app.getPath('userData'), 'temp_overlay.png');
    const overlayCreated = generateOverlayImage(
        overlayText || 'Demo Title',
        fontName || 'Arial',
        color || '#FFFFFF',
        tempPngPath
    );

    if (!overlayCreated) {
        event.sender.send('video:error', {
            fileName,
            error: 'Không thể tạo overlay image'
        });
        return;
    }

    // --- BƯỚC B: GỌI FFMPEG ---
    // Kiểm tra FFmpeg có tồn tại không
    if (!fs.existsSync(FFMPEG_PATH)) {
        console.error(`[FFmpeg] Không tìm thấy FFmpeg tại: ${FFMPEG_PATH}`);
        event.sender.send('video:error', {
            fileName,
            error: `FFmpeg không tồn tại tại ${FFMPEG_PATH}`
        });
        return;
    }

    // Logic: Resize 9:16 (1080x1920) + Overlay PNG
    const args = [
        '-y', // Ghi đè file nếu tồn tại
        '-i', inputPath, // Input video
        '-i', tempPngPath, // Input ảnh overlay
        '-filter_complex',
        '[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg];[bg][1:v]overlay=0:0',
        '-c:v', 'libx264',
        '-preset', 'ultrafast', // Tốc độ cao nhất
        '-c:a', 'copy', // Copy audio
        outputPath
    ];

    console.log(`[FFmpeg] Executing: ${FFMPEG_PATH} ${args.join(' ')}`);

    // Spawn tiến trình con
    const ffmpeg = spawn(FFMPEG_PATH, args);

    // Lắng nghe log để tính % (FFmpeg gửi info qua stderr)
    let duration = 0;
    ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();

        // 1. Tìm duration tổng của video
        if (output.includes('Duration:')) {
            const parts = output.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
            if (parts) {
                duration = parseInt(parts[1]) * 3600 + parseInt(parts[2]) * 60 + parseInt(parts[3]);
                console.log(`[FFmpeg] Duration detected: ${duration}s`);
            }
        }

        // 2. Tìm thời gian hiện tại đang xử lý (time=...)
        if (output.includes('time=')) {
            const parts = output.match(/time=(\d{2}):(\d{2}):(\d{2})/);
            if (parts && duration > 0) {
                const currentTime = parseInt(parts[1]) * 3600 + parseInt(parts[2]) * 60 + parseInt(parts[3]);
                const percent = Math.min(Math.round((currentTime / duration) * 100), 100);

                // Gửi % về Frontend
                event.sender.send('video:progress', { fileName, percent });
            }
        }
    });

    ffmpeg.on('close', (code) => {
        console.log(`[Main] Render xong. Code: ${code}`);

        // Xóa file temp
        if (fs.existsSync(tempPngPath)) {
            fs.unlinkSync(tempPngPath);
        }

        if (code === 0) {
            event.sender.send('video:complete', { fileName, path: outputPath, code });
        } else {
            event.sender.send('video:error', { fileName, error: `FFmpeg exited with code ${code}` });
        }
    });

    ffmpeg.on('error', (error) => {
        console.error(`[FFmpeg] Error:`, error);
        event.sender.send('video:error', { fileName, error: error.message });
    });
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true, // Bật contextIsolation để bảo mật
            nodeIntegration: false,
            webSecurity: false // Tắt bảo mật để load ảnh local thoải mái
        },
        autoHideMenuBar: true,
        icon: path.join(__dirname, 'public/laptop.png')
    });

    if (isDev) {
        win.loadURL('http://localhost:5175');
    } else {
        // Load file HTML đã build
        win.loadFile(path.join(__dirname, 'dist/index.html'));
    }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
