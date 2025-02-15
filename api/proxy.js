const fetch = require('node-fetch');
const WebSocket = require('ws');

module.exports = async (req, res) => {
  // Handle WebSocket upgrade requests
  if (req.headers['upgrade'] === 'websocket') {
    res.status(426).json({ error: 'Upgrade Required' });
    return;
  }

  const targetUrl = `https://91appw.com${req.url.replace('/proxy', '')}`;

  try {
    // Forward the original request headers
    const headers = {
      ...req.headers,
      'Origin': 'https://91appw.com',
      'ar-origin': 'https://91appw.com',
      'ar-real-ip': '127.0.0.1',
      'Referer': 'https://91appw.com/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': '*/*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Connection': 'keep-alive'
    };

    // Remove host header to avoid conflicts
    delete headers.host;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      redirect: 'follow',
      follow: 5
    });

    // Get the response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Set CORS and security headers
    responseHeaders['Access-Control-Allow-Origin'] = '*';
    responseHeaders['Access-Control-Allow-Methods'] = '*';
    responseHeaders['Access-Control-Allow-Headers'] = '*';
    responseHeaders['Access-Control-Allow-Credentials'] = 'true';
    responseHeaders['Access-Control-Expose-Headers'] = '*';

    // Remove restrictive headers
    delete responseHeaders['x-frame-options'];
    delete responseHeaders['content-security-policy'];
    delete responseHeaders['content-security-policy-report-only'];
    delete responseHeaders['x-content-type-options'];
    delete responseHeaders['strict-transport-security'];

    // Handle MIME types
    if (req.url.includes('/assets/')) {
      if (req.url.endsWith('.js')) {
        responseHeaders['content-type'] = 'application/javascript; charset=utf-8';
      }
      else if (req.url.endsWith('.css')) {
        responseHeaders['content-type'] = 'text/css; charset=utf-8';
      }
      else if (req.url.endsWith('.json')) {
        responseHeaders['content-type'] = 'application/json; charset=utf-8';
      }
    }

    // Send the response
    res.writeHead(response.status, responseHeaders);

    // Stream the response body
    if (response.body) {
      response.body.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).json({ 
      error: 'Proxy Error',
      details: error.message,
      url: targetUrl
    });
  }
};

// Add WebSocket support
module.exports.config = {
  api: {
    bodyParser: false,
  },
}; 