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
      HOST: '0.0.0.0'
    },
    deploy: {
      production: {
        'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js'
      }
    }
  }]
}; 