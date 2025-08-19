#!/bin/bash

# Oracle Cloud ARM Instance Startup Script for Breezy API
# Optimized for ARM64 compute instances with Oracle Linux

set -e

echo "🚀 Setting up Breezy API on Oracle Cloud ARM64..."

# Detect architecture
ARCH=$(uname -m)
echo "📊 Detected architecture: $ARCH"

if [[ "$ARCH" != "aarch64" && "$ARCH" != "arm64" ]]; then
    echo "⚠️  Warning: This script is optimized for ARM64 instances"
    echo "   Current architecture: $ARCH"
    echo "   Continuing anyway..."
fi

# Update system for Oracle Linux
echo "📦 Updating system packages..."
sudo dnf update -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker for ARM64..."
    sudo dnf install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    echo "🔧 Installing Docker Compose for ARM64..."
    # Use the ARM64 binary
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-linux-aarch64" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose already installed"
fi

# Configure firewall
echo "🔒 Configuring firewall..."
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
echo "✅ Firewall configured"

# Create application directory
echo "📁 Creating application directory..."
APP_DIR="/home/opc/breezy-api"
mkdir -p $APP_DIR
cd $APP_DIR

# Create environment file template
echo "⚙️ Creating environment configuration..."
cat > .env << EOF
# Production Environment Variables
JWT_SECRET=CHANGE_THIS_TO_A_SECURE_SECRET_KEY_MINIMUM_32_CHARACTERS
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
CORS_ORIGIN=*
DATABASE_URL=file:./data/database.db
EOF

echo "✅ Environment file created at $APP_DIR/.env"

# Create systemd service for auto-restart
echo "🔄 Creating systemd service..."
sudo tee /etc/systemd/system/breezy-api.service > /dev/null << EOF
[Unit]
Description=Breezy API Docker Container
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
User=opc
Group=docker

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable breezy-api
echo "✅ Systemd service created and enabled"

# Create backup script
echo "💾 Creating backup script..."
cat > $APP_DIR/backup.sh << 'EOF'
#!/bin/bash
# Database backup script
BACKUP_DIR="/home/opc/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Stop the container temporarily
docker-compose stop api

# Copy database
cp /home/opc/breezy-api/data/database.db $BACKUP_DIR/database_$DATE.db

# Restart container
docker-compose start api

echo "Backup created: $BACKUP_DIR/database_$DATE.db"
EOF

chmod +x $APP_DIR/backup.sh
echo "✅ Backup script created at $APP_DIR/backup.sh"

# Create deployment script
echo "🚀 Creating deployment script..."
cat > $APP_DIR/deploy.sh << 'EOF'
#!/bin/bash
# Deployment script for updates

set -e

echo "🔄 Deploying Breezy API updates..."

# Pull latest changes (if using git)
# git pull origin main

# Rebuild and restart containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

echo "✅ Deployment completed successfully"

# Show logs
docker-compose logs -f api
EOF

chmod +x $APP_DIR/deploy.sh
echo "✅ Deployment script created at $APP_DIR/deploy.sh"

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Upload your project files to: $APP_DIR"
echo "2. Edit $APP_DIR/.env with your production values"
echo "3. Run: cd $APP_DIR && docker-compose up -d"
echo "4. Check status: docker-compose ps"
echo "5. View logs: docker-compose logs -f api"
echo ""
echo "Your API will be available at: http://$(curl -s ifconfig.me):3000"
echo ""
echo "⚠️  Important: Change the JWT_SECRET in .env file before starting!"
