#!/bin/bash

# Build the application locally
npm run build

# SSH into server and deploy
ssh your-username@your-server-ip << 'ENDSSH'
  # Navigate to app directory
  cd /path/to/your/app

  # Pull latest changes
  git pull

  # Install dependencies
  npm install --production

  # Restart the server using PM2
  pm2 restart fiewin-web || pm2 start server.js --name fiewin-web
ENDSSH 