const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // 1. Video Editor (GIỮ NGUYÊN)
    videoEditor: {
        openFile: () => ipcRenderer.invoke('dialog:openFile'),
        openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
        scanVideos: (folderPath) => ipcRenderer.invoke('video:scan', folderPath),
        getFonts: () => ipcRenderer.invoke('video:getFonts'),
        processTitle: (config) => ipcRenderer.invoke('video:processTitle', config),
        createPng: (config) => ipcRenderer.invoke('video:createPng', config),
        renderVideo: (config) => ipcRenderer.send('video:render', config),
        onProgress: (cb) => { ipcRenderer.removeAllListeners('video:progress'); ipcRenderer.on('video:progress', (e, d) => cb(d)); },
        onComplete: (cb) => { ipcRenderer.removeAllListeners('video:complete'); ipcRenderer.on('video:complete', (e, d) => cb(d)); },
        onError: (cb) => { ipcRenderer.removeAllListeners('video:error'); ipcRenderer.on('video:error', (e, d) => cb(d)); },
        removeAllListeners: () => {
            ipcRenderer.removeAllListeners('video:progress');
            ipcRenderer.removeAllListeners('video:complete');
            ipcRenderer.removeAllListeners('video:error');
        }
    },

    // 2. USER MANAGEMENT (GIỮ NGUYÊN)
    user: {
        getAll: () => ipcRenderer.invoke('user:getAll'),
        create: (data) => ipcRenderer.invoke('user:create', data),
        delete: (id) => ipcRenderer.invoke('user:delete', id),
        update: (data) => ipcRenderer.invoke('user:update', data),
        changePassword: (data) => ipcRenderer.invoke('user:changePassword', data),
        login: (creds) => ipcRenderer.invoke('auth:login', creds)
    },

    // 3. PROFILES (MỚI THÊM)
    profile: {
        getAll: () => ipcRenderer.invoke('profile:getAll'),
        create: (data) => ipcRenderer.invoke('profile:create', data),
        delete: (id) => ipcRenderer.invoke('profile:delete', id),
    },

    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
        invoke: (channel, data) => ipcRenderer.invoke(channel, data),
        removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
    }
});
