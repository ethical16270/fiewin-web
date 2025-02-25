#!/bin/bash

# Exit on error
set -e

# Variables - Update these with your values
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
echo "Installing required packages..."
apt install -y nginx certbot python3-certbot-nginx ufw nodejs npm

# Set up firewall
echo "Configuring firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw --force enable

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Create directory for the application
echo "Setting up application directory..."
mkdir -p /var/www/app

# Copy application files to the server
# Note: You should upload your files to the server before running this script
# or use git to clone your repository

# Copy Nginx configuration
echo "Configuring Nginx..."
cp nginx.conf /etc/nginx/sites-available/$DOMAIN
sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/$DOMAIN
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Set up SSL with Let's Encrypt
echo "Setting up SSL with Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m $EMAIL

# Start the application with PM2
echo "Starting the application with PM2..."
cd /var/www/app
npm install
npm run build
pm2 start server.js --name "fiewin-web"
pm2 save
pm2 startup

echo "Deployment completed successfully!"
echo "Your application should now be accessible at https://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Update your domain's DNS settings to point to your Digital Ocean droplet's IP address"
echo "2. Make sure your application is running correctly"
echo "3. Set up automatic backups and monitoring for your droplet" 