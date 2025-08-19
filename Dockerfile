FROM node:24

# Install necessary dependencies for Prisma and SQLite
RUN apt-get update && apt-get install -y openssl sqlite3 && rm -rf /var/lib/apt/lists/*

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

# Make startup script executable
RUN chmod +x /app/start-railway.sh

# Create data directory with proper permissions
RUN mkdir -p /app/data && chmod 755 /app/data

# Expose port (Railway will automatically assign PORT environment variable)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV DATABASE_URL="file:./data/database.db"

# Start the application with the startup script
CMD ["/app/start-railway.sh"]
