const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Security middleware with adjusted CSP for Render
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for now to debug
  crossOriginEmbedderPolicy: false
}));

// Enable CORS
app.use(cors());

// Enable gzip compression
app.use(compression());

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build'), {
  maxAge: '1y',
  etag: true,
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Handle proxy requests
app.get('/proxy', (req, res) => {
  res.status(200).send('Proxy endpoint');
});

// Handle all routes by serving index.html
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 