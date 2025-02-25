# Setting Up Global Access to Your Digital Ocean Droplet

This guide will help you set up your Digital Ocean droplet to be accessible globally with a domain name and HTTPS.

## Prerequisites

1. A Digital Ocean account
2. A domain name (purchased from a domain registrar like Namecheap, GoDaddy, etc.)
3. Your application code (the fiewin-web project)

## Step 1: Create a Digital Ocean Droplet

1. Log in to your Digital Ocean account
2. Click on "Create" and select "Droplets"
3. Choose an image: Ubuntu 22.04 LTS x64
4. Choose a plan: Basic (Shared CPU)
   - Select the plan that fits your needs (at least 1GB RAM recommended)
5. Choose a datacenter region close to your target audience
6. Authentication: SSH keys (recommended) or Password
7. Choose a hostname (e.g., fiewin-web)
8. Click "Create Droplet"

## Step 2: Point Your Domain to the Droplet

1. Note your droplet's IP address from the Digital Ocean dashboard
2. Go to your domain registrar's website
3. Find the DNS management section
4. Create an A record:
   - Host: @ (or leave blank)
   - Points to: Your droplet's IP address
   - TTL: Automatic or 3600
5. Create another A record for the www subdomain:
   - Host: www
   - Points to: Your droplet's IP address
   - TTL: Automatic or 3600
6. Wait for DNS propagation (can take up to 24-48 hours, but often much faster)

## Step 3: Connect to Your Droplet

```bash
ssh root@your-droplet-ip
```

## Step 4: Upload Your Application Files

Option 1: Use SCP to upload files:
```bash
# From your local machine
scp -r /path/to/fiewin-web root@your-droplet-ip:/var/www/app
```

Option 2: Clone from Git repository:
```bash
# On your droplet
cd /var/www
git clone https://github.com/your-username/fiewin-web.git app
```

## Step 5: Upload Configuration Files

Upload the nginx.conf and deploy.sh files to your droplet:
```bash
# From your local machine
scp nginx.conf deploy.sh root@your-droplet-ip:~
```

## Step 6: Run the Deployment Script

1. Edit the deploy.sh script to update the domain and email variables:
```bash
# On your droplet
nano deploy.sh
```

2. Update these lines with your information:
```bash
DOMAIN="your-domain.com"
EMAIL="your-email@example.com"
```

3. Make the script executable and run it:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Step 7: Verify Your Setup

1. Visit your domain in a web browser (https://your-domain.com)
2. Check that your application loads correctly
3. Verify that HTTPS is working properly (look for the lock icon in your browser)

## Additional Configuration

### Setting Up Environment Variables

If your application requires environment variables:
```bash
# On your droplet
cd /var/www/app
nano .env
```

Add your environment variables:
```
NODE_ENV=production
PORT=3000
PROXY_TARGET=https://91appw.com
# Add any other environment variables your app needs
```

### Monitoring Your Application

PM2 provides basic monitoring. To view your application status:
```bash
pm2 status
pm2 logs
```

For more advanced monitoring, consider setting up:
1. Digital Ocean Monitoring
2. Uptime Robot (https://uptimerobot.com/)
3. New Relic or Datadog for performance monitoring

### Automatic Backups

1. In your Digital Ocean dashboard, go to your droplet
2. Click on "Backups"
3. Enable weekly backups

## Troubleshooting

### Application Not Loading

Check the application logs:
```bash
pm2 logs
```

### Nginx Issues

Check Nginx configuration and logs:
```bash
nginx -t
cat /var/log/nginx/error.log
```

### SSL Certificate Issues

Check Let's Encrypt logs:
```bash
cat /var/log/letsencrypt/letsencrypt.log
```

Renew certificates manually:
```bash
certbot renew
```

## Security Considerations

1. Set up a non-root user with sudo privileges
2. Configure SSH key-based authentication only
3. Keep your system and packages updated regularly
4. Consider setting up fail2ban to prevent brute force attacks
5. Regularly review your firewall rules

## Need Help?

If you encounter any issues, refer to:
- Digital Ocean Community tutorials: https://www.digitalocean.com/community/tutorials
- Nginx documentation: https://nginx.org/en/docs/
- Let's Encrypt documentation: https://letsencrypt.org/docs/ 