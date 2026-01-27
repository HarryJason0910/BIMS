# Job Bid Management System - Build & Deployment Guide

## 🚀 Quick Build

**Just double-click `build.bat` to build everything!**

## 📋 Build Process

### 1. Development Build
```bash
# Install dependencies
npm install

# Build backend
npm run build --workspace=packages/backend

# Build frontend  
npm run build --workspace=packages/frontend
```

### 2. Using Batch Files

#### **`build.bat`** - Complete Build
- Installs dependencies if needed
- Builds backend TypeScript to JavaScript
- Builds frontend React app for production
- Creates optimized production bundles

#### **`start-production.bat`** - Production Server
- Starts backend in production mode
- Serves built backend from `packages/backend/dist/`
- Frontend build available in `packages/frontend/dist/`

## 📁 Build Artifacts

After building, you'll have:

```
packages/
├── backend/
│   ├── dist/           # Compiled JavaScript (production ready)
│   ├── src/            # TypeScript source code
│   └── package.json
└── frontend/
    ├── dist/           # Built React app (production ready)
    ├── src/            # React source code
    └── package.json
```

## 🔧 Production Deployment

### Backend Deployment

1. **Built files**: `packages/backend/dist/`
2. **Environment**: Set `NODE_ENV=production`
3. **Start command**: `npm start` (runs `node dist/index.js`)
4. **Port**: Default 3000 (configurable via `PORT` env var)

### Frontend Deployment

1. **Built files**: `packages/frontend/dist/`
2. **Web server**: Serve static files from `dist/` folder
3. **Examples**:
   - **Nginx**: Point document root to `dist/`
   - **Apache**: Serve from `dist/` directory
   - **Node.js**: Use `express.static('dist')`

### Environment Configuration

#### Backend `.env` (Production)
```bash
NODE_ENV=production
PORT=3000
USE_MONGODB=true
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=job-bid-system-prod

# Microsoft Graph API (for email integration)
GRAPH_CLIENT_ID=your-production-client-id
GRAPH_CLIENT_SECRET=your-production-client-secret
GRAPH_TENANT_ID=your-tenant-id
GRAPH_USER_EMAIL=your-email@company.com

# Email Configuration
EMAIL_POLL_INTERVAL_MS=300000
EMAIL_FILTER_KEYWORDS=interview,rejection,application

# Security
CORS_ORIGIN=https://your-domain.com
```

#### Frontend `.env` (Production)
```bash
VITE_API_BASE_URL=https://your-api-domain.com
```

## 🐳 Docker Deployment (Optional)

### Backend Dockerfile
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY packages/backend/package*.json ./
RUN npm ci --only=production
COPY packages/backend/dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

### Frontend Dockerfile
```dockerfile
FROM nginx:alpine
COPY packages/frontend/dist /usr/share/nginx/html
EXPOSE 80
```

## 🔍 Build Verification

### Test Backend Build
```bash
cd packages/backend
npm start
# Should start server on http://localhost:3000
# Check http://localhost:3000/health
```

### Test Frontend Build
```bash
cd packages/frontend
npx serve dist
# Should serve app on http://localhost:3000
```

## 🚨 Troubleshooting

### Common Build Issues

1. **TypeScript Errors**
   - Fix type errors in source code
   - Check `tsconfig.json` configuration

2. **Missing Dependencies**
   - Run `npm install` in root directory
   - Check `package.json` files

3. **Environment Variables**
   - Ensure `.env` files exist
   - Check variable names and values

### Build Logs

- Backend build logs: Check TypeScript compiler output
- Frontend build logs: Check Vite build output
- Runtime logs: Check console output when starting servers

## 📊 Performance

### Backend (Node.js + Express)
- **Memory**: ~50-100MB
- **CPU**: Low (event-driven)
- **Startup**: ~2-3 seconds

### Frontend (React + Tauri)
- **Bundle size**: ~270KB (gzipped: ~85KB)
- **Load time**: <2 seconds on modern browsers
- **Memory**: ~20-50MB

## 🔐 Security Considerations

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS for API endpoints
- [ ] Configure CORS properly
- [ ] Use secure MongoDB connection
- [ ] Rotate API keys regularly
- [ ] Enable request rate limiting
- [ ] Use environment variables for secrets
- [ ] Regular security updates

---

**That's it! Your Job Bid Management System is ready for production deployment!** 🎉