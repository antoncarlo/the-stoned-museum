# Railway Deployment Guide - The Stoned Museum

## 🚀 Deployment Status

✅ **Server Configuration Fixed**
- Added `/health` endpoint for Railway health checks
- Fixed static files path in production
- Improved error handling and logging
- Server binds to `0.0.0.0` for Railway compatibility

✅ **Build Process Verified**
- Production build creates `dist/` directory correctly
- Static files are served from `dist/public/`
- Server bundle is created at `dist/index.js`

✅ **Environment Variables Validated**
- All critical variables are properly configured
- Validation script available at `server/_core/validate-env.ts`

## 🔧 Required Environment Variables

### Critical Variables (Required for deployment)

```bash
# Application Configuration
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=https://vidabiz.butterfly-effect.dev

# Database
DATABASE_URL=mysql://username:password@host:port/database_name

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters

# Infrastructure
PORT=3000
NODE_ENV=production
```

### Optional Variables

```bash
# Admin Access
OWNER_OPEN_ID=your_owner_open_id

# OpenAI Integration
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_KEY=your_openai_api_key

# Forge API
BUILT_IN_FORGE_API_URL=your_forge_api_url
BUILT_IN_FORGE_API_KEY=your_forge_api_key

# Analytics
VITE_ANALYTICS_ENDPOINT=your_analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=your_website_id
```

## 📋 Railway Configuration

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "pnpm install && pnpm run build"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ['nodejs_20', 'pnpm-9_x', 'openssl']
```

## 🔍 Health Check Endpoints

Railway can use these endpoints to verify the application is running:

- **Health Check**: `GET /health`
  - Returns: `{"status":"ok","timestamp":"...","env":"production"}`
  - Status: `200 OK`

- **Ping**: `GET /ping`
  - Returns: `pong`
  - Status: `200 OK`

## 🗄️ Database Setup

The application uses MySQL with Drizzle ORM. Ensure your DATABASE_URL follows this format:

```
mysql://username:password@host:port/database_name
```

### Database Schema
The application will automatically handle database migrations and schema setup.

## 🔄 Deployment Steps

1. **Set Environment Variables in Railway**
   ```bash
   # Set all required variables in Railway dashboard
   railway variables set VITE_APP_ID=your_app_id
   railway variables set DATABASE_URL=mysql://...
   railway variables set JWT_SECRET=your_secret
   railway variables set OAUTH_SERVER_URL=https://vidabiz.butterfly-effect.dev
   railway variables set NODE_ENV=production
   ```

2. **Deploy from Git**
   ```bash
   # Connect your repository to Railway
   railway login
   railway link
   railway up
   ```

3. **Verify Deployment**
   ```bash
   # Check health endpoint
   curl https://your-app.railway.app/health
   
   # Should return:
   # {"status":"ok","timestamp":"...","env":"production"}
   ```

## 🐛 Troubleshooting

### Common Issues

1. **502 Bad Gateway**
   - ✅ Fixed: Server now binds to `0.0.0.0`
   - ✅ Fixed: Health check endpoint added
   - ✅ Fixed: Static files path corrected

2. **Build Failures**
   - Ensure all dependencies are in `package.json`
   - Check that `pnpm install && pnpm run build` works locally

3. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Ensure database is accessible from Railway
   - Check database credentials

4. **Environment Variables**
   - Run validation: `npx tsx server/_core/validate-env.ts`
   - Ensure all critical variables are set in Railway

### Logs and Monitoring

```bash
# View Railway logs
railway logs

# Check specific service logs
railway logs --service your-service-name
```

## 🎯 Success Criteria

After deployment, verify these features work:

- [ ] Site loads at Railway URL
- [ ] Health check returns 200 OK
- [ ] Login page displays correctly
- [ ] 3D intro animation works
- [ ] Main pages load without errors
- [ ] Database operations function
- [ ] Cron jobs initialize (check logs)

## 📞 Support

If deployment issues persist:

1. Check Railway logs for specific errors
2. Verify all environment variables are set
3. Test the build process locally
4. Ensure database connectivity

---

**Last Updated**: October 30, 2025  
**Version**: 1.0  
**Status**: Ready for Deployment ✅