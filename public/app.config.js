// App configuration
window.APP_CONFIG = {
  version: '1.0.0',
  buildTime: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  api: {
    baseUrl: '/api',
    timeout: 30000
  },
  features: {
    gameTracking: true,
    analytics: true
  }
}; 