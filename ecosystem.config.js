module.exports = {
  apps: [{
    name: 'fiewin-web',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 80,
      HOST: '0.0.0.0',
      DOMAIN: 'your-domain.com' // You'll need to replace this with your actual domain
    },
    setup: 'npm install && npm run build'
  }]
}; 