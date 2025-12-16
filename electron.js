const { app, BrowserWindow } = require('electron');
const path = require('path');

// Xác định môi trường
const isDev = !app.isPackaged;

// --- CẤU HÌNH MÔI TRƯỜNG CHO FILE .EXE ---
if (!isDev) {
    // 1. Cấu hình Database: Trỏ vào file data.db nằm cạnh file .exe
    process.env.DATABASE_URL = `file:${path.join(process.resourcesPath, 'prisma/data.db')}`;

    // 2. Cấu hình Port: Ép cứng cổng 3000
    process.env.PORT = 3000;

    // 3. Cấu hình FFmpeg (Cho Video Editor sau này)
    process.env.FFMPEG_PATH = path.join(process.resourcesPath, 'ffmpeg.exe');
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

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
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
