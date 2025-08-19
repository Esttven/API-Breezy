#!/bin/bash

# Deployment Status Check Script for Oracle Cloud
# This script checks if the Breezy API is running correctly

echo "🔍 Checking Breezy API Deployment Status..."
echo "========================================"

# Check if Docker is running
if ! systemctl is-active --quiet docker; then
    echo "❌ Docker is not running"
    exit 1
else
    echo "✅ Docker is running"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed"
    exit 1
else
    echo "✅ Docker Compose is installed"
fi

# Check if containers are running
if [ -f "docker-compose.yml" ]; then
    CONTAINER_STATUS=$(docker-compose ps -q api)
    if [ -z "$CONTAINER_STATUS" ]; then
        echo "❌ API container is not running"
        echo "🔄 Attempting to start..."
        docker-compose up -d
    else
        echo "✅ API container is running"
    fi
else
    echo "❌ docker-compose.yml not found"
    exit 1
fi

# Check API health endpoint
echo ""
echo "🏥 Checking API Health..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response http://localhost:3000/api/health)
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is healthy (HTTP $HTTP_CODE)"
    echo "📄 Health Response:"
    cat /tmp/health_response | jq '.' 2>/dev/null || cat /tmp/health_response
else
    echo "❌ API health check failed (HTTP $HTTP_CODE)"
    echo "📄 Response:"
    cat /tmp/health_response
fi

# Check database
echo ""
echo "🗄️ Checking Database..."
if [ -f "data/database.db" ]; then
    DB_SIZE=$(du -h data/database.db | cut -f1)
    echo "✅ Database exists (Size: $DB_SIZE)"
else
    echo "⚠️ Database file not found (will be created on first use)"
fi

# Check disk space
echo ""
echo "💾 Checking Disk Space..."
DISK_USAGE=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "⚠️ Disk usage is high: ${DISK_USAGE}%"
else
    echo "✅ Disk usage is normal: ${DISK_USAGE}%"
fi

# Check memory usage
echo ""
echo "🧠 Checking Memory Usage..."
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
echo "📊 Memory usage: ${MEMORY_USAGE}%"

# Check recent logs
echo ""
echo "📋 Recent Logs (last 10 lines):"
docker-compose logs --tail=10 api 2>/dev/null || echo "Could not retrieve logs"

# Final status
echo ""
echo "🎯 Deployment Summary:"
echo "====================="

# Get external IP
EXTERNAL_IP=$(curl -s ifconfig.me)
if [ ! -z "$EXTERNAL_IP" ]; then
    echo "🌍 External IP: $EXTERNAL_IP"
    echo "🔗 API URL: http://$EXTERNAL_IP:3000/api"
    echo "🏥 Health Check: http://$EXTERNAL_IP:3000/api/health"
else
    echo "🔗 API URL: http://localhost:3000/api"
fi

echo ""
echo "✅ Status check completed!"

# Cleanup
rm -f /tmp/health_response
