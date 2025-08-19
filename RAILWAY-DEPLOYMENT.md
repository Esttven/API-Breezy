# Railway Deployment Guide for Breezy API

This guide will help you deploy your Breezy API to Railway, a modern platform for deploying applications with ease.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Docker**: Railway will use the included Dockerfile for deployment

## Project Structure

Your project is now optimized for Railway deployment with the following key files:

- `Dockerfile` - Container configuration for Railway
- `railway.json` - Railway-specific deployment configuration  
- `docker-compose.yml` - Local development with Docker
- `.env.example` - Environment variables template

## Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your latest changes are committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2. Create a New Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the Dockerfile

### 3. Configure Environment Variables

In your Railway project dashboard, go to the Variables tab and add:

```env
DATABASE_URL=file:./data/database.db
JWT_SECRET=your-super-secure-jwt-secret-key-change-this
JWT_EXPIRES_IN=7d
NODE_ENV=production
CORS_ORIGIN=*
```

**Important**: Generate a strong JWT secret for production!

### 4. Configure Database Persistence

Since we're using SQLite, we need to ensure data persistence:

1. In Railway dashboard, go to Settings
2. Add a Volume mount at `/app/data` to persist your SQLite database
3. This ensures your database survives deployments

### 5. Deploy

Railway will automatically deploy your application. You can monitor the deployment:

1. Check the deployment logs in the Railway dashboard
2. Once deployed, Railway will provide a public URL
3. Your API will be available at: `https://your-app-name.railway.app`

## Health Checks

Your application includes a health check endpoint at `/api/health` that Railway uses to monitor your service.

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | SQLite database file path | `file:./data/database.db` | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` | No |
| `PORT` | Application port | Railway sets automatically | No |
| `NODE_ENV` | Node environment | `production` | No |
| `CORS_ORIGIN` | CORS allowed origins | `*` | No |

## Railway-Specific Features

### Automatic Port Assignment

Railway automatically assigns the `PORT` environment variable. Your app is configured to use this.

### Auto-Deploy on Git Push

Railway can automatically deploy when you push to your main branch.

### Logs and Monitoring

Access real-time logs and metrics through the Railway dashboard.

### Custom Domains

You can connect custom domains through the Railway dashboard.

## Local Development

To run the project locally with Docker:

```bash
# Build and run with Docker Compose
npm run docker:compose:up

# View logs
npm run docker:compose:logs

# Stop the container
npm run docker:compose:down
```

To run without Docker:

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

## Testing Your Deployment

Once deployed, test your API:

1. **Health Check**: `GET https://your-app-name.railway.app/api/health`
2. **Base API**: `GET https://your-app-name.railway.app/api`
3. **Test your endpoints**: Use the provided `Scoreboard-API-Tests.rest` file

## Troubleshooting

### Common Issues

1. **Database not persisting**: Ensure you've configured a volume mount at `/app/data`
2. **Environment variables**: Check all required variables are set in Railway dashboard
3. **Build failures**: Check the build logs in Railway dashboard

### Logs

View application logs in the Railway dashboard under the "Logs" tab.

### Support

- Railway Documentation: [docs.railway.app](https://docs.railway.app)
- Railway Discord: Join their community for support

## Security Considerations

1. **JWT Secret**: Use a strong, randomly generated JWT secret
2. **CORS**: Configure `CORS_ORIGIN` appropriately for your frontend domains
3. **Environment Variables**: Never commit sensitive data to your repository

## Database Migrations

Your app automatically runs database migrations on startup. For manual migration:

```bash
npm run db:migrate
```

## Monitoring

Railway provides built-in monitoring. You can also implement additional monitoring:

- Use the `/api/health` endpoint for external monitoring
- Set up alerts in Railway dashboard
- Monitor application logs

---

Your Breezy API is now ready for Railway deployment! 🚀
