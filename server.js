const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const fetch = require('node-fetch');
const WebSocket = require('ws');
const apiRoutes = require('./server/routes/api');
const { initializeDatabase } = require('./server/utils/initDb');
const { cleanupExpiredUTRs } = require('./server/utils/cleanup');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Add logging utility
const logRequest = (req, status, error = null) => {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    method: req.method,
    url: req.url,
    status,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    error: error ? error.message : null
  };
  console.log(JSON.stringify(log));
};

const app = express();

// Add at the top of server.js
const isProduction = process.env.NODE_ENV === 'production';
const PROXY_TARGET = process.env.PROXY_TARGET || 'https://91appw.com';

// Essential middleware first
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Security middleware with adjusted settings for React app
app.use(cors({
  origin: isProduction ? ['https://your-domain.com'] : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400
}));

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res.statusCode);
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Add this middleware before serving static files
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    res.header('Content-Security-Policy', "default-src 'self' 'unsafe-inline'");
    // Add watermark meta tag
    res.header('X-Frame-Options', 'SAMEORIGIN');
  }
  next();
});

// API routes first
app.use('/api', apiRoutes);

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1y',
  etag: false
}));

// Serve public files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d',
  etag: false
}));

// Special handling for app.config.js
app.get('/app.config.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.config.js'));
});

// Handle React routing - this should be after API routes but before error handling
app.get('*', (req, res, next) => {
  // Skip API routes and static files
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'build', 'index.html'), err => {
    if (err) {
      console.error('Error sending index.html:', err);
      next(err);
    }
  });
});

// Error handling middleware must be last
app.use((err, req, res, next) => {
  console.error('Express error handler:', err);
  res.status(err.status || 500).json({
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Health check with detailed status
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    version: process.version
  };
  res.status(200).json(health);
});

// Proxy endpoint with fixed headers
app.use('/proxy', createProxyMiddleware({
  target: PROXY_TARGET,
  changeOrigin: true,
  secure: false,
  ws: true, // Enable WebSocket proxying
  pathRewrite: {
    '^/proxy': ''
  },
  onProxyRes: function(proxyRes, req, res) {
    // Remove CORS and security headers that might block loading
    proxyRes.headers['access-control-allow-origin'] = '*';
    delete proxyRes.headers['x-frame-options'];
    delete proxyRes.headers['content-security-policy'];
    
    // Set correct content types
    if (req.url.endsWith('.js')) {
      proxyRes.headers['content-type'] = 'application/javascript';
    } else if (req.url.endsWith('.css')) {
      proxyRes.headers['content-type'] = 'text/css';
    }
  }
}));

// Handle OPTIONS requests
app.options('/proxy/*', (req, res) => {
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Expose-Headers': '*'
  }).sendStatus(200);
});

// Add before your other routes
const visitedUrls = new Set();

app.post('/api/log-url', (req, res) => {
  const { url, timestamp, userAgent } = req.body;
  
  // Log to console
  console.log('URL Visit Log:', {
    url,
    timestamp,
    userAgent,
    ip: req.ip
  });

  // Store in memory
  visitedUrls.add(JSON.stringify({
    url,
    timestamp,
    userAgent,
    ip: req.ip
  }));

  res.status(200).json({ success: true });
});

// Endpoint to get all logged URLs
app.get('/api/urls', (req, res) => {
  const urlArray = Array.from(visitedUrls).map(str => JSON.parse(str));
  res.json(urlArray);
});

// Add this after your proxy middleware
app.get('/proxy-health', async (req, res) => {
  try {
    const response = await fetch(PROXY_TARGET);
    if (response.ok) {
      res.status(200).json({ status: 'ok', target: PROXY_TARGET });
    } else {
      res.status(response.status).json({ 
        status: 'error', 
        message: `Target returned ${response.status}` 
      });
    }
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
});

const startServer = async () => {
  try {
    // Initialize database
    const db = await initializeDatabase();
    
    // Add process.env.PORT as fallback ports
    const port = process.env.PORT || 3001;  // Changed from 3000
    const wsPort = process.env.WS_PORT || 4001;  // Changed from 4000
    
    const server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    // Setup WebSocket server
    const wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      clientTracking: true,
      handleProtocols: (protocols, req) => {
        return protocols[0];
      }
    });

    // Add error handler for the WebSocket server
    wss.on('error', (error) => {
      console.error('WebSocket Server Error:', error);
    });

    // Update the connection handler
    wss.on('connection', (ws, req) => {
      console.log('New WebSocket connection from:', req.socket.remoteAddress);

      // Add error handler for each connection
      ws.on('error', (error) => {
        console.error('WebSocket Connection Error:', error);
      });

      // Send initial connection message
      ws.send(JSON.stringify({ type: 'connection', message: 'Connected to server' }));

      // Handle incoming messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          console.log('Received:', data);
          
          // Handle different message types
          switch(data.type) {
            case 'ping':
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
              }
              break;
            default:
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
              }
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
          }
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });

    // Setup cleanup interval
    setInterval(cleanupExpiredUTRs, 1000 * 60 * 60); // Run every hour
    cleanupExpiredUTRs(); // Run immediately on startup

    // Graceful shutdown with cleanup
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        // Add any cleanup operations here
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Perform any necessary cleanup
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Perform any necessary cleanup
}); 