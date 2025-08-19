#!/bin/bash
# ARM64 Deployment script for Oracle Cloud ARM instances

set -e

echo "🚀 Deploying Breezy API for ARM64 architecture..."

# Check if we're on ARM64
ARCH=$(uname -m)
if [[ "$ARCH" != "aarch64" && "$ARCH" != "arm64" ]]; then
    echo "⚠️  Warning: Not on ARM64 architecture (detected: $ARCH)"
    echo "   This deployment script is optimized for ARM64"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

echo "🔄 Stopping existing containers..."
docker-compose -f docker-compose.arm64.yml down || docker-compose down

echo "🔨 Building ARM64 optimized image..."
docker build --platform linux/arm64 --no-cache -t breezy-api .

echo "🗄️ Regenerating Prisma client for ARM64..."
npx prisma generate --binary-targets=linux-arm64-openssl-3.0.x

echo "🚀 Starting ARM64 containers..."
if [ -f "docker-compose.arm64.yml" ]; then
    docker-compose -f docker-compose.arm64.yml up -d
else
    echo "⚠️  ARM64 compose file not found, using default"
    docker-compose up -d
fi

echo "⏳ Waiting for service to be ready..."
sleep 10

echo "🏥 Testing health endpoint..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ ARM64 deployment successful!"
    echo "🔗 API is running at: http://$(curl -s ifconfig.me):3000/api"
else
    echo "❌ Health check failed"
    echo "📋 Recent logs:"
    docker-compose logs --tail=20 api
    exit 1
fi

echo "📊 Container status:"
docker-compose ps

echo "✅ ARM64 deployment completed successfully!"
