const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/proxy',
    createProxyMiddleware({
      target: 'https://91appw.com',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/proxy': ''
      },
      router: {
        '/proxy': 'https://91appw.com',
      },
      onProxyRes: function(proxyRes, req, res) {
        // Force correct MIME types for all assets
        if (req.url.includes('/assets/')) {
          if (req.url.endsWith('.js')) {
            delete proxyRes.headers['content-type'];
            proxyRes.headers['content-type'] = 'application/javascript; charset=utf-8';
          }
          else if (req.url.endsWith('.css')) {
            delete proxyRes.headers['content-type'];
            proxyRes.headers['content-type'] = 'text/css; charset=utf-8';
          }
          else if (req.url.endsWith('.json')) {
            delete proxyRes.headers['content-type'];
            proxyRes.headers['content-type'] = 'application/json; charset=utf-8';
          }
        }

        // Set permissive CORS headers
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = '*';
        proxyRes.headers['Access-Control-Allow-Headers'] = '*';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
        proxyRes.headers['Access-Control-Expose-Headers'] = '*';

        // Remove restrictive headers
        delete proxyRes.headers['x-frame-options'];
        delete proxyRes.headers['content-security-policy'];
        delete proxyRes.headers['content-security-policy-report-only'];
        delete proxyRes.headers['x-content-type-options'];
        delete proxyRes.headers['strict-transport-security'];
      },
      onProxyReq: function(proxyReq, req, res) {
        // Set required headers
        proxyReq.setHeader('Origin', 'https://91appw.com');
        proxyReq.setHeader('ar-origin', 'https://91appw.com');
        proxyReq.setHeader('ar-real-ip', '127.0.0.1');
        proxyReq.setHeader('Referer', 'https://91appw.com/');
        
        // Set accept headers based on request type
        if (req.url.endsWith('.js')) {
          proxyReq.setHeader('Accept', 'application/javascript');
        }
        else if (req.url.endsWith('.css')) {
          proxyReq.setHeader('Accept', 'text/css');
        }
        else if (req.url.endsWith('.json')) {
          proxyReq.setHeader('Accept', 'application/json');
        }
        else {
          proxyReq.setHeader('Accept', '*/*');
        }

        proxyReq.setHeader('Accept-Language', 'en-US,en;q=0.9');
        proxyReq.setHeader('Cache-Control', 'no-cache');
        proxyReq.setHeader('Pragma', 'no-cache');
      },
      onError: function(err, req, res) {
        console.error('Proxy Error:', err);
        res.status(500).send('Proxy Error');
      },
      ws: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
  );

  // Add a second proxy specifically for assets
  app.use(
    '/assets',
    createProxyMiddleware({
      target: 'https://91appw.com',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/assets': '/assets'
      },
      onProxyRes: function(proxyRes, req, res) {
        // Force JavaScript MIME type for .js files
        if (req.url.endsWith('.js')) {
          delete proxyRes.headers['content-type'];
          proxyRes.headers['content-type'] = 'application/javascript; charset=utf-8';
        }
        // Force CSS MIME type for .css files
        else if (req.url.endsWith('.css')) {
          delete proxyRes.headers['content-type'];
          proxyRes.headers['content-type'] = 'text/css; charset=utf-8';
        }
      }
    })
  );

  app.use(
    '/ws',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      ws: true,
      changeOrigin: true
    })
  );

  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true
    })
  );
}; 