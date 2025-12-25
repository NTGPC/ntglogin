const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // --- 1. Module Video Editor (MỚI) ---
    videoEditor: {
        // Dialog chọn file/folder
        openFile: () => ipcRenderer.invoke('dialog:openFile'),
        openFolder: () => ipcRenderer.invoke('dialog:openFolder'),

        // Quét danh sách video
        scanVideos: (folderPath) => ipcRenderer.invoke('video:scan', folderPath),

        // Lấy danh sách Font
        getFonts: () => ipcRenderer.invoke('video:getFonts'),

        // Xử lý Title (Clear, Rename, tạo file txt)
        processTitle: (config) => ipcRenderer.invoke('video:processTitle', config),

        // Tạo file PNG (Vẽ chữ lên ảnh)
        createPng: (config) => ipcRenderer.invoke('video:createPng', config),

        // Render Video (FFmpeg)
        renderVideo: (config) => ipcRenderer.send('video:render', config),

        // Listeners (Lắng nghe tiến trình)
        onProgress: (callback) => {
            // Xóa listener cũ trước khi thêm mới để tránh duplicate
            ipcRenderer.removeAllListeners('video:progress');
            ipcRenderer.on('video:progress', (event, data) => callback(data));
        },
        onComplete: (callback) => {
            ipcRenderer.removeAllListeners('video:complete');
            ipcRenderer.on('video:complete', (event, data) => callback(data));
        },
        onError: (callback) => {
            ipcRenderer.removeAllListeners('video:error');
            ipcRenderer.on('video:error', (event, data) => callback(data));
        },
        removeAllListeners: () => {
            ipcRenderer.removeAllListeners('video:progress');
            ipcRenderer.removeAllListeners('video:complete');
            ipcRenderer.removeAllListeners('video:error');
        }
    },

    // --- 2. MODULE USER & AUTH (CẬP NHẬT MỚI) ---
    user: {
        // Lấy danh sách user
        getAll: () => ipcRenderer.invoke('user:getAll'),

        // Tạo user mới
        create: (userData) => ipcRenderer.invoke('user:create', userData),

        // Cập nhật user
        update: (userData) => ipcRenderer.invoke('user:update', userData),

        // Đổi mật khẩu
        changePassword: (data) => ipcRenderer.invoke('user:changePassword', data),

        // Xóa user
        delete: (id) => ipcRenderer.invoke('user:delete', id),

        // Đăng nhập
        login: (credentials) => ipcRenderer.invoke('auth:login', credentials)
    },

    // --- 3. Các Module cũ (Giữ lại để tương thích) ---
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
        invoke: (channel, data) => ipcRenderer.invoke(channel, data),
        removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
    }
});