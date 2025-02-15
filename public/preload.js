const { contextBridge, ipcRenderer } = require('electron');

// Inject our custom API
contextBridge.exposeInMainWorld(
    "CursorApp", {
        // Version info
        version: '1.0.0',
        
        // Send messages to main process
        send: (channel, data) => {
            const validChannels = ["toMain"];
            if (validChannels.includes(channel)) {
                ipcRenderer.send(channel, data);
            }
        },
        
        // Receive messages from main process
        receive: (channel, func) => {
            const validChannels = ["fromMain"];
            if (validChannels.includes(channel)) {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
            }
        },

        // Add watermark
        addWatermark: () => {
            const watermark = document.createElement('div');
            watermark.className = 'cursor-watermark';
            watermark.innerHTML = 'This app developed by Cursor';
            watermark.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 5px; z-index: 999999; font-family: Arial;';
            document.body.appendChild(watermark);
        }
    }
);

// Expose safe APIs to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    log: (message) => {
        console.log('[Cursor Debug]', message);
    },
    error: (message) => {
        console.error('[Cursor Error]', message);
    },
    warn: (message) => {
        console.warn('[Cursor Warning]', message);
    }
}); 