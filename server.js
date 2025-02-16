const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const fetch = require('node-fetch');
const WebSocket = require('ws');

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

// Configure CORS before other middleware
app.use(cors({
  origin: isProduction ? ['https://your-domain.com'] : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400
}));

// Security middleware with adjusted settings
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enable gzip compression
app.use(compression());

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

// Serve static files with proper content types
app.use(express.static(path.join(__dirname, 'build'), {
  setHeaders: (res, filePath) => {
    // For all JavaScript files
    if (filePath.endsWith('.js')) {
      res.set({
        'Content-Type': 'application/javascript; charset=UTF-8',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      });
    }
    // For CSS files
    if (filePath.endsWith('.css')) {
      res.set({
        'Content-Type': 'text/css; charset=UTF-8',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*'
      });
    }
    // For HTML files
    if (filePath.endsWith('.html')) {
      res.set({
        'Content-Type': 'text/html; charset=UTF-8',
        'X-Content-Type-Options': 'nosniff'
      });
    }
  }
}));

// Add specific routes for assets
app.get('/assets/css/*', (req, res, next) => {
  res.set({
    'Content-Type': 'text/css; charset=UTF-8',
    'Access-Control-Allow-Origin': '*'
  });
  next();
});

app.get('/assets/js/*', (req, res, next) => {
  res.set({
    'Content-Type': 'text/javascript; charset=UTF-8',
    'Access-Control-Allow-Origin': '*'
  });
  next();
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
app.use('/proxy', async (req, res) => {
  const targetUrl = `${PROXY_TARGET}${req.url}`;
  
  try {
    // Specific headers that work with 91appw.com
    const headers = {
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Content-Type': 'application/json',
      'Origin': 'https://91appw.com',
      'Pragma': 'no-cache',
      'Referer': 'https://91appw.com/',
      'sec-ch-ua': '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    };

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      redirect: 'follow'
    });

    // Set CORS headers first
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Expose-Headers': '*'
    });

    // Get content type
    const contentType = response.headers.get('content-type');
    
    // Set single content type
    if (contentType) {
      res.set('Content-Type', contentType.split(',')[0].trim());
    } else {
      res.set('Content-Type', 'application/json; charset=UTF-8');
    }

    // Handle response based on content type
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        res.json(json);
      } catch (e) {
        res.send(text);
      }
    } else {
      response.body.pipe(res);
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({
      error: 'Proxy Error',
      message: error.message,
      status: 500,
      path: req.url,
      timestamp: new Date().toISOString()
    });
  }
});

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

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Handle app.config.js specifically
app.get('/app.config.js', (req, res) => {
  res.set({
    'Content-Type': 'application/javascript; charset=UTF-8',
    'X-Content-Type-Options': 'nosniff'
  });
  res.sendFile(path.join(__dirname, 'build', 'app.config.js'));
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  const errorResponse = {
    error: err.name || 'Internal Server Error',
    message: err.message,
    status: statusCode,
    path: req.url,
    timestamp: new Date().toISOString()
  };

  // Log error details
  console.error('Application Error:', {
    ...errorResponse,
    stack: err.stack,
    headers: req.headers,
    query: req.query,
    body: req.body
  });

  logRequest(req, statusCode, err);
  res.status(statusCode).json(errorResponse);
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
});

// Add WebSocket server with path
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

// Graceful shutdown with cleanup
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    // Add any cleanup operations here
    process.exit(0);
  });
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