# Use Node.js 18 LTS Alpine for Railway deployment
FROM node:18-alpine

# Install necessary dependencies for Prisma and SQLite
RUN apk add --no-cache openssl sqlite

# Create app directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy application code
COPY . .

# Create data directory with proper permissions
RUN mkdir -p /app/data && chmod 755 /app/data

# Expose port (Railway will automatically assign PORT environment variable)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application with database initialization
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
