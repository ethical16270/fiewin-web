const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const fetch = require('node-fetch');

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

// Security middleware with adjusted CSP for Render
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Enable CORS
app.use(cors());

// Enable gzip compression
app.use(compression());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logRequest(req, res.statusCode);
    console.log(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

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

// Proxy endpoint with detailed error handling
app.use('/proxy', async (req, res) => {
  const targetUrl = `https://91appw.com${req.url}`;
  
  try {
    // Validate request
    if (!req.url) {
      throw new Error('Invalid request URL');
    }

    const headers = {
      ...req.headers,
      'Origin': 'https://91appw.com',
      'ar-origin': 'https://91appw.com',
      'ar-real-ip': '127.0.0.1',
      'Referer': 'https://91appw.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };
    delete headers.host;

    // Log proxy request
    console.log(`Proxying request to: ${targetUrl}`);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      redirect: 'follow'
    });

    // Check response status
    if (!response.ok) {
      throw new Error(`Proxy target returned ${response.status}: ${response.statusText}`);
    }

    // Forward response headers
    Object.entries(response.headers.raw()).forEach(([key, value]) => {
      res.set(key, value);
    });

    // Set CORS headers
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Expose-Headers': '*'
    });

    // Stream the response with error handling
    response.body.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream Error', details: error.message });
      }
    });

    response.body.pipe(res);
  } catch (error) {
    // Detailed error logging
    console.error('Proxy Error:', {
      url: targetUrl,
      method: req.method,
      error: error.message,
      stack: error.stack
    });

    // Send appropriate error response
    const statusCode = error.response?.status || 500;
    const errorResponse = {
      error: 'Proxy Error',
      message: error.message,
      status: statusCode,
      path: req.url,
      timestamp: new Date().toISOString()
    };

    logRequest(req, statusCode, error);
    res.status(statusCode).json(errorResponse);
  }
});

// Handle all routes by serving index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
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

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
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