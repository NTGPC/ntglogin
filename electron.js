const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createCanvas, registerFont, loadImage } = require('canvas');

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

// --- HELPER FUNCTIONS ---

function clean_title_text(text, rm_spaces = true, rm_hashtag = true, del_chars = "", prefix = "", suffix = "") {
    // 1. Xóa Hashtag (#Word)
    if (rm_hashtag) {
        text = text.replace(/#\S+/g, "");
    }

    // 2. Xóa ký tự tùy chọn
    if (del_chars) {
        // Tách các cụm từ cần xóa (ví dụ nhập: @* | . =)
        const tokens = del_chars.split(' '); // Tách bằng khoảng trắng như Python split()
        tokens.forEach(token => {
            if (token.includes('*')) {
                // Xóa wildcard (ví dụ @*)
                // Escape special regex chars except *
                const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '');
                // Regex: token_prefix + non-whitespace characters
                const regex = new RegExp(escaped + "\\S*", "g");
                text = text.replace(regex, "");
            } else {
                // Xóa ký tự thường
                text = text.split(token).join("");
            }
        });
    }

    // 3. Thay thế em dash (—) thành hyphen (-)
    text = text.replace(/—/g, "-");

    // 4. Xóa khoảng trắng thừa
    if (rm_spaces) {
        text = text.replace(/\s+/g, " ").trim();
    }

    // 5. Thêm tiền tố / hậu tố
    return `${prefix}${text}${suffix}`;
}

// --- IPC HANDLERS ---

// 0. DIALOG HANDLERS
ipcMain.handle('dialog:openFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
        ]
    });
    if (canceled) {
        return null;
    } else {
        return filePaths[0];
    }
});

// 1. XỬ LÝ SCAN FOLDER
ipcMain.handle('video:scan', async (event, folderPath) => {
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

        // Trả về mảng object chi tiết hơn
        const videoList = videos.map((file, idx) => ({
            id: String(idx + 1).padStart(4, '0'),
            name: file,
            path: path.join(folderPath, file),
            clean_name: path.parse(file).name
        }));

        return videoList; // Trả về trực tiếp mảng
    } catch (error) {
        console.error('[IPC] Lỗi scan folder:', error);
        return [];
    }
});

// 2. XỬ LÝ TITLE
ipcMain.handle('video:processTitle', async (event, config) => {
    try {
        const { videoPath, removeSpaces, removeHashtag, deleteChars, prefix, suffix } = config;
        const fileName = path.basename(videoPath);
        const nameOnly = path.parse(fileName).name;

        // Xử lý logic clean text
        const newTitle = clean_title_text(nameOnly, removeSpaces, removeHashtag, deleteChars, prefix, suffix);

        // Tạo thư mục title nếu chưa có
        const titleDir = path.join(app.getPath('userData'), 'title');
        if (!fs.existsSync(titleDir)) fs.mkdirSync(titleDir, { recursive: true });

        // Lưu file txt (dùng hash hoặc tên gốc để định danh)
        // Ở đây ta trả về đường dẫn txt để frontend lưu/quản lý
        const txtPath = path.join(titleDir, `${newTitle}.txt`); // Hoặc dùng ID video nếu có
        fs.writeFileSync(txtPath, newTitle, 'utf-8');

        // Logic rename file gốc (nếu cần)? 
        // Trong AutoRender python, nó logic rename file output. Ở đây frontend EditRatio có vẻ muốn rename ngay hoặc chỉ lấy kết quả.
        // EditRatio.tsx dòng 106: newVideos.push({ ...vid, name: res.newName, ... })
        // Vậy trả về newName

        return { success: true, newName: newTitle, txtPath };
    } catch (error) {
        console.error('[IPC] Lỗi process title:', error);
        return { success: false, error: error.message };
    }
});

// 2.5 LẤY DANH SÁCH FONTS
ipcMain.handle('video:getFonts', async () => {
    try {
        const fontDir = path.join(__dirname, 'font');
        if (!fs.existsSync(fontDir)) {
            fs.mkdirSync(fontDir, { recursive: true });
            return [];
        }
        const files = fs.readdirSync(fontDir);
        const fonts = files.filter(f => f.toLowerCase().endsWith('.ttf') || f.toLowerCase().endsWith('.otf'));
        return fonts;
    } catch (error) {
        console.error('[IPC] Lỗi get fonts:', error);
        return [];
    }
});

// 3. XỬ LÝ RENDER (CORE LOGIC)

// --- HÀM TẠO ẢNH PNG TỪ TEXT (CANVAS - ADVANCED) ---
async function generateOverlayImage(text, fontName, color, outputPath, bgPath, options = {}) {
    try {
        const {
            width = 1080,
            height = 1920,
            fontSize = 80,
            borderInfo = { color: '#000000', size: 0 },
            isUpperCase = false,
            isFirstLetter = false,
            boxCoords = [75, 330, 1005, 570] // Default coords from Python code
        } = options;

        // 1. Text Transformation
        if (isUpperCase) {
            text = text.toUpperCase();
        } else if (isFirstLetter) {
            // Capitalize first letter of each word
            text = text.toLowerCase().replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); });
        }

        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Clear & Load Background
        ctx.clearRect(0, 0, width, height);

        if (bgPath && fs.existsSync(bgPath)) {
            try {
                const bgImage = await loadImage(bgPath);
                ctx.drawImage(bgImage, 0, 0, width, height);
            } catch (err) {
                console.warn('[Canvas] Could not load background image:', err);
            }
        }

        // Font
        const fontPath = path.join(__dirname, 'font', `${fontName}.ttf`);
        // Fallback or load
        if (fs.existsSync(fontPath)) {
            // Register font with a family name matching the filename or custom
            registerFont(fontPath, { family: fontName });
            ctx.font = `bold ${fontSize}px "${fontName}"`;
        } else {
            ctx.font = `bold ${fontSize}px Arial`;
        }

        // Setup Box
        const [x1, y1, x2, y2] = boxCoords;
        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;

        // Word Wrap Logic (Max 3 lines)
        const words = text.split(' ');
        const lines = [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = ctx.measureText(currentLine + " " + word).width;
            if (width < boxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);

        // Truncate to max 3 lines with ellipsis
        const MAX_LINES = 3;
        if (lines.length > MAX_LINES) {
            const lastLineIndex = MAX_LINES - 1;
            lines.length = MAX_LINES; // Cut off extra lines

            // Add ellipsis to last line logic could be complex, simple approach:
            let lastLine = lines[lastLineIndex];
            while (ctx.measureText(lastLine + "...").width > boxWidth && lastLine.length > 0) {
                lastLine = lastLine.slice(0, -1);
            }
            lines[lastLineIndex] = lastLine + "...";
        }

        // Vertical Center
        // Estimate line height ~ fontSize * 1.2
        const lineHeight = fontSize * 1.2;
        const totalTextHeight = lines.length * lineHeight;
        const startY = y1 + (boxHeight - totalTextHeight) / 2 + (fontSize / 2); // approximate baseline

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const centerX = x1 + boxWidth / 2;

        const borderSize = Number(borderInfo.size || 0);
        const borderColor = borderInfo.color || '#000000';

        lines.forEach((line, i) => {
            const y = startY + i * lineHeight;

            // Border (Stroke simulation)
            if (borderSize > 0) {
                ctx.lineWidth = borderSize * 2; // Stroke is centered, so double width
                ctx.strokeStyle = borderColor;
                ctx.strokeText(line, centerX, y);
            }

            // Fill
            ctx.fillStyle = color;
            ctx.fillText(line, centerX, y);
        });

        // Save
        const buffer = canvas.toBuffer('image/png');
        fs.writeFileSync(outputPath, buffer);

        console.log(`[Canvas] Created overlay: ${outputPath}`);
        return true;
    } catch (error) {
        console.error('[Canvas] Error:', error);
        return false;
    }
}

// 3. TẠO PNG (HANDLER)
ipcMain.handle('video:createPng', async (event, config) => {
    try {
        const { txtPath, bgPath, fontName, color, size, borderInfo, isUpperCase, isFirstLetter } = config;

        // Đọc text từ file txt
        if (!fs.existsSync(txtPath)) throw new Error("File TXT không tồn tại");
        const text = fs.readFileSync(txtPath, 'utf-8').trim();

        // Output path (cùng tên với txt nhưng đuôi png)
        const outputDir = path.join(app.getPath('userData'), 'png');
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const fileName = path.parse(txtPath).name;
        const outputPath = path.join(outputDir, `${fileName}.png`);

        // Gọi hàm tạo ảnh
        const success = await generateOverlayImage(text, fontName, color, outputPath, bgPath, {
            fontSize: size,
            borderInfo,
            isUpperCase,
            isFirstLetter
        });

        if (success) {
            return { success: true, pngPath: outputPath };
        } else {
            return { success: false, error: "Lỗi tạo ảnh Canvas" };
        }
    } catch (error) {
        console.error('[IPC] Lỗi create png:', error);
        return { success: false, error: error.message };
    }
});

// 4. XỬ LÝ RENDER (CORE LOGIC)
ipcMain.on('video:render', async (event, config) => {
    const { videoPath, pngPath, outputFolder } = config;
    const fileName = path.basename(videoPath);

    // Tạo output folder nếu chưa có
    if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder, { recursive: true });
    }

    // Tên file output? Thường dùng tên file gốc
    const outputPath = path.join(outputFolder, fileName);
    console.log(`[Main] Bắt đầu render: ${fileName}`);

    // Kiểm tra FFmpeg
    if (!fs.existsSync(FFMPEG_PATH)) {
        event.sender.send('video:error', { fileName, error: `FFmpeg không tồn tại tại ${FFMPEG_PATH}` });
        return;
    }

    // Logic Args (Ported from Python)
    const args = [
        '-y',
        '-i', videoPath
    ];

    let filterComplex = "";
    if (pngPath && fs.existsSync(pngPath)) {
        args.push('-i', pngPath);
        filterComplex = "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[bg];[bg][1:v]overlay=0:0";
    } else {
        filterComplex = "[0:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2";
    }

    args.push(
        '-filter_complex', filterComplex,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        outputPath
    );

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
