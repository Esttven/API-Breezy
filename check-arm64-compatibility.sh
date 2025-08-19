#!/bin/bash

# ARM64 Compatibility Check Script for Oracle Cloud

echo "🔍 Oracle Cloud ARM64 Compatibility Check"
echo "=========================================="

# Check system architecture
ARCH=$(uname -m)
echo "📊 System Architecture: $ARCH"

if [[ "$ARCH" == "aarch64" || "$ARCH" == "arm64" ]]; then
    echo "✅ Running on ARM64 architecture"
    ARM64_NATIVE=true
else
    echo "⚠️  Not running on ARM64 (detected: $ARCH)"
    ARM64_NATIVE=false
fi

# Check OS
OS_INFO=$(cat /etc/os-release | grep PRETTY_NAME | cut -d '"' -f 2)
echo "🖥️  Operating System: $OS_INFO"

# Check Docker support
echo ""
echo "🐳 Docker Compatibility:"
if command -v docker &> /dev/null; then
    echo "✅ Docker is installed"
    
    # Check Docker buildx for multi-platform support
    if docker buildx version &> /dev/null; then
        echo "✅ Docker Buildx available (multi-platform builds supported)"
    else
        echo "⚠️  Docker Buildx not available"
    fi
    
    # Check available platforms
    echo "📦 Available Docker platforms:"
    docker buildx ls 2>/dev/null | grep -E "linux/(arm64|amd64)" || echo "   (Could not detect platforms)"
else
    echo "❌ Docker is not installed"
fi

# Check Node.js
echo ""
echo "📦 Node.js Compatibility:"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NODE_ARCH=$(node -e "console.log(process.arch)")
    echo "✅ Node.js installed: $NODE_VERSION"
    echo "📊 Node.js architecture: $NODE_ARCH"
    
    if [[ "$NODE_ARCH" == "arm64" ]]; then
        echo "✅ Node.js is ARM64 native"
    else
        echo "⚠️  Node.js is not ARM64 native (running under emulation)"
    fi
else
    echo "❌ Node.js is not installed"
fi

# Check npm packages compatibility
echo ""
echo "📚 Package Compatibility:"
if [ -f "package.json" ]; then
    echo "✅ package.json found"
    
    # Check for problematic packages
    PROBLEMATIC_PACKAGES=("sharp" "sqlite3" "node-gyp")
    for pkg in "${PROBLEMATIC_PACKAGES[@]}"; do
        if grep -q "\"$pkg\"" package.json; then
            echo "⚠️  Found potentially problematic package: $pkg"
        fi
    done
    
    # Check Prisma
    if grep -q "prisma" package.json; then
        echo "✅ Prisma detected - ARM64 compatible with proper binary targets"
    fi
else
    echo "❌ package.json not found"
fi

# Check Prisma binary targets
echo ""
echo "🗄️  Prisma Configuration:"
if [ -f "prisma/schema.prisma" ]; then
    if grep -q "linux-arm64" prisma/schema.prisma; then
        echo "✅ Prisma configured with ARM64 binary targets"
    else
        echo "⚠️  Prisma not configured for ARM64 (add linux-arm64-openssl-3.0.x to binaryTargets)"
    fi
else
    echo "❌ Prisma schema not found"
fi

# Check Dockerfile
echo ""
echo "🐳 Dockerfile ARM64 Configuration:"
if [ -f "Dockerfile" ]; then
    if grep -q "linux/arm64\|--platform.*arm64" Dockerfile; then
        echo "✅ Dockerfile configured for ARM64"
    else
        echo "⚠️  Dockerfile should specify --platform=linux/arm64"
    fi
else
    echo "❌ Dockerfile not found"
fi

# Oracle Cloud specific checks
echo ""
echo "☁️  Oracle Cloud Optimizations:"

# Check memory usage
TOTAL_MEM=$(free -h | awk '/^Mem:/ {print $2}')
echo "💾 Available Memory: $TOTAL_MEM"

# Check CPU cores
CPU_CORES=$(nproc)
echo "⚡ CPU Cores: $CPU_CORES"

# Performance recommendation
echo ""
echo "🎯 ARM64 Performance Recommendations:"
echo "   • Use --platform=linux/arm64 in Dockerfile"
echo "   • Configure Prisma with linux-arm64-openssl-3.0.x binary target"
echo "   • Use native ARM64 Node.js images"
echo "   • Test with docker-compose.arm64.yml"

# Final assessment
echo ""
echo "📋 Compatibility Assessment:"
if [[ "$ARM64_NATIVE" == true ]]; then
    echo "✅ EXCELLENT - Running on native ARM64"
    echo "   Your application should have optimal performance"
elif command -v docker &> /dev/null; then
    echo "⚡ GOOD - Docker can handle ARM64 builds"
    echo "   Use multi-platform builds for best compatibility"
else
    echo "⚠️  LIMITED - Missing Docker support"
    echo "   Install Docker for proper ARM64 deployment"
fi

echo ""
echo "🚀 Ready for Oracle Cloud ARM64 deployment!"
echo "   Use: npm run oracle:deploy:arm64"
