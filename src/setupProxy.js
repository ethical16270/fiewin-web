const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Single proxy for API requests
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('Proxying:', req.method, req.url);
      },
      onError: (err, req, res) => {
        console.error('Proxy Error:', err);
        res.status(500).json({
          success: false,
          message: 'Proxy error occurred'
        });
      }
    })
  );

  // WebSocket proxy
  app.use(
    '/socket.io',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      ws: true
    })
  );
}; 