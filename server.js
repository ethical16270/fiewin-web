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

// Security middleware
app.use(cors({
  origin: isProduction ? ['https://your-domain.com'] : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: true,
  maxAge: 86400
}));

// Development specific middleware
if (!isProduction) {
  app.use((req, res, next) => {
    logRequest(req, 200);
    next();
  });
}

app.use(helmet({
  contentSecurityPolicy: false, // Disabled for development
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
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

// Add near the top after middleware
app.use((req, res, next) => {
  console.log('Request URL:', req.url);
  console.log('Request Headers:', req.headers);
  next();
});

// Add this middleware before other routes to handle %PUBLIC_URL% requests
app.use((req, res, next) => {
  if (req.url.includes('%PUBLIC_URL%')) {
    // Remove %PUBLIC_URL% and forward to static files
    const newUrl = req.url.replace(/%PUBLIC_URL%/g, '');
    console.log('Redirecting %PUBLIC_URL% request:', req.url, 'to:', newUrl);
    req.url = newUrl;
  }
  next();
});

// Serve static files in the correct order
app.use('/static', express.static(path.join(__dirname, 'build/static'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.use(express.static(path.join(__dirname, 'build'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Keep other static file middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Handle favicon.ico specifically
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'favicon.ico'));
});

// Special handling for app.config.js
app.get('/app.config.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'app.config.js'));
});

// API routes
app.use('/api', apiRoutes);

// Error handling for malformed URLs
app.use((err, req, res, next) => {
  if (err instanceof URIError) {
    return res.status(400).send('Bad Request');
  }
  next(err);
});

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
}

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

const PORT = process.env.PORT || 3000;
const API_PORT = process.env.API_PORT || 4000;

const startServer = async () => {
  try {
    await initializeDatabase();
    
    const server = app.listen(isProduction ? PORT : API_PORT, () => {
      console.log(`Server running on port ${isProduction ? PORT : API_PORT} in ${process.env.NODE_ENV} mode`);
    });

    // WebSocket setup
    const wss = new WebSocket.Server({ server });
    
    wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      
      ws.on('message', (message) => {
        // Handle WebSocket messages
        console.log('received: %s', message);
      });
      
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

// Add production security headers
if (process.env.NODE_ENV === 'production') {
  app.use(helmet());
  app.use(compression());
  app.disable('x-powered-by');
  
  // Serve static files from build folder
  app.use(express.static(path.join(__dirname, 'build')));
  
  // Handle React routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
  });
} 