#!/bin/bash
# ==============================================================================
# AWS EC2 User Data Script (Amazon Linux 2023 / RHEL 9)
# Automates deployment of the AI ATS Resume Analyzer application
# ==============================================================================

set -e

# Redirect output to user-data log for debugging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "[Deploy] Starting automated provisioning on AWS EC2..."

# 1. Update OS packages
dnf update -y

# 2. Install Git, Nginx, and Node.js 20
dnf install -y git nginx

# Install Node.js 20.x from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs

echo "[Deploy] Installed Node $(node -v) and NPM $(npm -v)"

# 3. Create deployment directory
APP_DIR="/home/ec2-user/ai-ats-resume-analyzer"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# 4. Clone or pull code (replace with your group's Git repository URL)
# Example: git clone https://github.com/<your-username>/ai-ats-resume-analyzer.git .
# For standalone deployment, copy files directly.
if [ -d ".git" ]; then
    git pull origin main
fi

# 5. Install production dependencies
npm install --omit=dev

# Ensure uploads and reports directories exist with correct permissions
mkdir -p uploads reports
chown -R ec2-user:ec2-user "$APP_DIR"

# 6. Configure systemd service
cat << 'EOF' > /etc/systemd/system/ats-app.service
[Unit]
Description=AI ATS Resume Analyzer Node.js Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/ai-ats-resume-analyzer
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ats-app
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=AWS_REGION=us-east-1

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ats-app
systemctl restart ats-app

# 7. Configure Nginx Reverse Proxy
cat << 'EOF' > /etc/nginx/conf.d/ats-app.conf
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 15M;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Test Nginx configuration and start service
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "[Deploy] Provisioning complete. Application is active on port 80."
