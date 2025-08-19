#!/bin/sh
set -e

echo "Starting Railway deployment..."
echo "Environment: $NODE_ENV"
echo "Database URL: $DATABASE_URL"
echo "Port: $PORT"

# Ensure data directory exists
echo "Creating data directory..."
mkdir -p /app/data
chmod 755 /app/data

# Run database migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Generate Prisma client (ensure it's up to date)
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Test database connection
echo "🔍 Testing database connection..."
node -e "
const { PrismaClient } = require('./generated/prisma/index.js');
const prisma = new PrismaClient();
prisma.\$queryRaw\`SELECT 1\`.then(() => {
  console.log('✅ Database connection successful');
  prisma.\$disconnect();
}).catch(err => {
  console.error('❌ Database connection failed:', err);
  process.exit(1);
});
"

# Start the application
echo "🎯 Starting the Node.js application..."
exec npm start
