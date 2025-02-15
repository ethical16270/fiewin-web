const { app, BrowserWindow, session } = require('electron');
const path = require('path');

// Instead of require, we'll check the environment directly
const isDev = !app.isPackaged;

function createWindow() {
    // Disable QUIC protocol to prevent audio loading errors
    app.commandLine.appendSwitch('disable-quic');
    // Enable proper audio streaming
    app.commandLine.appendSwitch('enable-features', 'NetworkService,NetworkServiceInProcess');

    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            devTools: true,
            preload: path.join(__dirname, 'preload.js'),
            // Enable proper media handling
            webSecurity: false,
            allowRunningInsecureContent: true
        }
    });

    // Handle CORS and security headers
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        const headers = { ...details.responseHeaders };
        
        // Remove existing headers
        delete headers['access-control-allow-origin'];
        delete headers['access-control-allow-methods'];
        delete headers['access-control-allow-headers'];
        delete headers['x-frame-options'];
        delete headers['content-security-policy'];

        // Add comprehensive CORS headers
        headers['Access-Control-Allow-Origin'] = ['*'];
        headers['Access-Control-Allow-Methods'] = ['GET, POST, OPTIONS, PUT, DELETE, PATCH'];
        headers['Access-Control-Allow-Headers'] = [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'ar-origin',
            'ar-real-ip',
            'Origin',
            'Accept',
            'Range',  // Add Range header for audio streaming
            'Access-Control-Request-Method',
            'Access-Control-Request-Headers'
        ].join(', ');
        headers['Access-Control-Allow-Credentials'] = ['true'];
        headers['Access-Control-Max-Age'] = ['3600'];
        headers['Access-Control-Expose-Headers'] = ['Content-Length, Content-Range, Content-Type'];  // Add for audio streaming
        
        callback({ responseHeaders: headers });
    });

    // Handle audio file requests specifically
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const headers = details.requestHeaders;
        
        // Set required headers for the request
        headers['Origin'] = 'https://91appw.com';
        headers['ar-origin'] = 'https://91appw.com';
        headers['ar-real-ip'] = '127.0.0.1';
        headers['Access-Control-Request-Headers'] = 'ar-origin, ar-real-ip';

        // Add headers for audio streaming if it's an audio file
        if (details.url.endsWith('.mp3')) {
            headers['Range'] = 'bytes=0-';
            headers['Accept'] = 'audio/mp3,audio/*;q=0.9,*/*;q=0.8';
        }
        
        callback({ requestHeaders: headers });
    });

    // Inject watermark and fix Vue components
    mainWindow.webContents.on('did-frame-finish-load', () => {
        const injectionScript = `
            // Add watermark
            const watermark = document.createElement('div');
            watermark.style.cssText = \`
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 8px 15px;
                border-radius: 8px;
                z-index: 2147483646;
                font-family: Arial, sans-serif;
                font-size: 14px;
            \`;
            watermark.innerHTML = 'Developed by Cursor';
            document.body.appendChild(watermark);

            // Fix Vue component resolution
            if (window.Vue) {
                // Define the Point component globally
                window.Vue.component('Point', {
                    template: '<div></div>'  // Empty template as fallback
                });

                // Configure Vue to ignore custom elements
                if (window.Vue.config) {
                    window.Vue.config.compilerOptions = window.Vue.config.compilerOptions || {};
                    window.Vue.config.compilerOptions.isCustomElement = tag => tag.includes('-');
                }
            }
        `;

        mainWindow.webContents.executeJavaScript(injectionScript)
            .catch(err => console.error('Script injection failed:', err));
    });

    // Add route-specific script injection
    mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
        // Check if the URL matches the WinGo game page
        if (url.includes('/home/AllLotteryGames/WinGo?id=1')) {
            console.log('[Cursor] Detected WinGo page, injecting script...');
            
            const wingoScript = `
                // Clear any existing intervals first
                if (window.cursorCheckInterval) {
                    clearInterval(window.cursorCheckInterval);
                }
                if (window.cursorTimeoutId) {
                    clearTimeout(window.cursorTimeoutId);
                }

                function injectWingoAnimation() {
                    const greenElements = document.querySelectorAll('.Betting__C-head-g');
                    const redElements = document.querySelectorAll('.Betting__C-head-r');

                    const elements = [...greenElements, ...redElements];

                    if (elements.length === 0) {
                        console.error('[Cursor] No elements found with class Betting__C-head-g or Betting__C-head-r');
                        return false;
                    }

                    console.log('[Cursor] Found ' + elements.length + ' elements to animate');
                    
                    const randomElement = elements[Math.floor(Math.random() * elements.length)];

                    // Remove any existing animation styles
                    const existingStyle = document.getElementById('cursor-blink-style');
                    if (existingStyle) {
                        existingStyle.remove();
                    }

                    const blinkAnimation = \`
                        @keyframes cursorBlink {
                            0% { opacity: 1; }
                            50% { opacity: 0; }
                            100% { opacity: 1; }
                        }
                    \`;

                    const styleSheet = document.createElement('style');
                    styleSheet.id = 'cursor-blink-style';
                    styleSheet.innerText = blinkAnimation;
                    document.head.appendChild(styleSheet);

                    randomElement.style.animation = 'cursorBlink 0.5s linear infinite';
                    console.log('[Cursor] Started animation on element:', randomElement.className);

                    setTimeout(() => {
                        randomElement.style.animation = '';
                        console.log('[Cursor] Animation completed');
                    }, 3000);

                    return true;
                }

                // Start checking for elements
                console.log('[Cursor] Starting element check...');
                window.cursorCheckInterval = setInterval(() => {
                    if (injectWingoAnimation()) {
                        clearInterval(window.cursorCheckInterval);
                        console.log('[Cursor] Successfully injected and cleared interval');
                    }
                }, 1000);

                // Set timeout to clear interval
                window.cursorTimeoutId = setTimeout(() => {
                    if (window.cursorCheckInterval) {
                        clearInterval(window.cursorCheckInterval);
                        console.log('[Cursor] Cleared interval after timeout');
                    }
                }, 10000);
            `;

            mainWindow.webContents.executeJavaScript(wingoScript)
                .then(() => console.log('[Cursor] Script injection successful'))
                .catch(err => console.error('[Cursor] Script injection failed:', err));
        }
    });

    // Also inject on regular navigation
    mainWindow.webContents.on('did-navigate', (event, url) => {
        if (url.includes('/home/AllLotteryGames/WinGo?id=1')) {
            console.log('[Cursor] Detected WinGo page after full navigation');
            // Re-run the same script
            mainWindow.webContents.executeJavaScript(wingoScript)
                .then(() => console.log('[Cursor] Script injection successful after navigation'))
                .catch(err => console.error('[Cursor] Script injection failed after navigation:', err));
        }
    });

    // Add navigation logging
    mainWindow.webContents.on('did-navigate', (event, url) => {
        console.log('[Navigation]', new Date().toISOString(), 'User navigated to:', url);
    });

    mainWindow.webContents.on('did-navigate-in-page', (event, url) => {
        console.log('[In-Page Navigation]', new Date().toISOString(), 'User navigated to:', url);
    });

    // Add frame navigation logging
    mainWindow.webContents.on('did-frame-navigate', (event, url, httpResponseCode, httpStatusText) => {
        console.log('[Frame Navigation]', {
            timestamp: new Date().toISOString(),
            url: url,
            statusCode: httpResponseCode,
            statusText: httpStatusText
        });
    });

    // Log URL changes through history API
    mainWindow.webContents.on('did-frame-finish-load', () => {
        const urlLoggingScript = `
            // Monitor URL changes
            const pushState = window.history.pushState;
            window.history.pushState = function() {
                console.log('[URL Change]', new Date().toISOString(), 'New URL:', window.location.href);
                return pushState.apply(history, arguments);
            };

            const replaceState = window.history.replaceState;
            window.history.replaceState = function() {
                console.log('[URL Replace]', new Date().toISOString(), 'New URL:', window.location.href);
                return replaceState.apply(history, arguments);
            };

            window.addEventListener('popstate', function() {
                console.log('[URL Pop]', new Date().toISOString(), 'Current URL:', window.location.href);
            });
        `;

        mainWindow.webContents.executeJavaScript(urlLoggingScript)
            .catch(err => console.error('URL logging script injection failed:', err));
    });

    // Load the target website
    mainWindow.loadURL('https://91appw.com');

    // Open DevTools in development mode
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }

    // Log window events
    mainWindow.webContents.on('crashed', () => {
        console.error('Window crashed');
    });

    mainWindow.on('unresponsive', () => {
        console.warn('Window became unresponsive');
    });

    // Add specific error handling for media
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
        console.log('[Media Error]', {
            errorCode,
            errorDescription,
            url: validatedURL,
            timestamp: new Date().toISOString()
        });
    });
}

// Handle app ready
app.whenReady().then(() => {
    createWindow();

    // Set up protocol handler for custom scheme
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('cursor-app', process.execPath, [path.resolve(process.argv[1])]);
        }
    } else {
        app.setAsDefaultProtocolClient('cursor-app');
    }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Recreate window when dock icon is clicked (macOS)
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
}); 