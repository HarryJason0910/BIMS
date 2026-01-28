# Desktop App Connection Fix

## Problem
The Tauri desktop app wasn't connecting to the backend because:
1. Axios HTTP client needs proper configuration for Tauri environment
2. Content Security Policy (CSP) needed to allow localhost connections
3. Missing debug logging to troubleshoot connection issues

## What Was Fixed

### 1. API Client Updates (`packages/frontend/src/api/client.ts`)
- ✅ Added Tauri environment detection
- ✅ Added debug logging for Tauri requests
- ✅ Added request/response interceptors for better error tracking

### 2. Tauri Configuration (`packages/frontend/src-tauri/tauri.conf.json`)
- ✅ Updated CSP to explicitly allow `http://localhost:3000` and `http://127.0.0.1:3000`
- ✅ HTTP allowlist already configured for these endpoints
- ✅ Added proper security headers

### 3. Created Tauri-Specific Client (`packages/frontend/src/api/tauri-client.ts`)
- ✅ Alternative implementation using Tauri's native HTTP client
- ✅ Available as fallback if Axios doesn't work

## How to Test

### Step 1: Ensure Backend is Running

```cmd
start-backend.bat
```

Wait for: `Server running on port 3000`

### Step 2: Test Backend Connectivity

```cmd
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Step 3: Build and Run Desktop App

**Option A: Development Mode (Recommended for Testing)**

```cmd
start-frontend-desktop.bat
```

Or manually:
```cmd
cd packages\frontend
npm run tauri:dev
```

**Option B: Production Build**

```cmd
cd packages\frontend
npm run tauri build
```

The built app will be in: `packages/frontend/src-tauri/target/release/`

### Step 4: Check Desktop App Console

When the desktop app opens:
1. Right-click anywhere in the app
2. Select "Inspect Element" or press `Ctrl+Shift+I`
3. Go to the "Console" tab
4. Look for these messages:
   ```
   [Tauri Mode] API Client initialized with baseURL: http://localhost:3000
   [Tauri Mode] Using native fetch for HTTP requests
   [Tauri Request] GET /api/interviews
   [Tauri Request] GET /api/bids
   ```

### Step 5: Test Functionality

Try these actions in the desktop app:
1. **View Bids** - Should load existing bids from backend
2. **View Interviews** - Should load existing interviews
3. **Create a Bid** - Fill out the form and submit
4. **Schedule an Interview** - Create a new interview

## Troubleshooting

### Desktop App Shows "No response from server"

**Check 1: Backend is Running**
```cmd
curl http://localhost:3000/health
```

**Check 2: Check Desktop App Console**
- Open DevTools (`Ctrl+Shift+I`)
- Look for error messages in Console tab
- Check Network tab for failed requests

**Check 3: Verify .env File**
```cmd
type packages\frontend\.env
```

Should show:
```
VITE_API_BASE_URL=http://localhost:3000
```

**Check 4: Rebuild Desktop App**
```cmd
cd packages\frontend
npm run tauri build
```

### CORS Errors in Desktop App

If you see CORS errors in the console:

1. Check backend `.env` file:
   ```
   CORS_ORIGIN=http://localhost:5173,tauri://localhost,http://tauri.localhost
   ```

2. Rebuild backend:
   ```cmd
   rebuild-backend.bat
   ```

3. Restart backend:
   ```cmd
   start-backend.bat
   ```

### Tauri HTTP Scope Errors

If you see "URL not allowed by scope" errors:

1. Check `packages/frontend/src-tauri/tauri.conf.json`:
   ```json
   "http": {
     "scope": ["http://localhost:3000/**", "http://127.0.0.1:3000/**"]
   }
   ```

2. Rebuild the desktop app

### CSP Errors

If you see Content Security Policy errors:

1. Check `packages/frontend/src-tauri/tauri.conf.json`:
   ```json
   "security": {
     "csp": "default-src 'self'; connect-src 'self' http://localhost:3000 http://127.0.0.1:3000; ..."
   }
   ```

2. Rebuild the desktop app

## Debug Mode

To see detailed logs:

1. Run in development mode:
   ```cmd
   cd packages\frontend
   npm run tauri:dev
   ```

2. Open DevTools in the app (`Ctrl+Shift+I`)

3. Watch the Console for:
   - `[Tauri Mode]` - Environment detection
   - `[Tauri Request]` - Outgoing requests
   - `[API Error]` - Error details

## Alternative: Use Tauri Native HTTP Client

If Axios continues to have issues, we have a backup implementation using Tauri's native HTTP client.

To switch to it:

1. Edit `packages/frontend/src/api/index.ts`:
   ```typescript
   export { TauriApiClient as apiClient } from './tauri-client';
   ```

2. Rebuild the desktop app

## Comparison: Web vs Desktop

| Feature | Web App | Desktop App |
|---------|---------|-------------|
| HTTP Client | Axios (browser) | Axios (with Tauri support) |
| CORS | Required | Required |
| CSP | Browser default | Tauri configured |
| DevTools | Browser F12 | Right-click → Inspect |
| Port | 5173 | N/A (standalone) |

## Files Modified

1. **packages/frontend/src/api/client.ts** - Added Tauri detection and logging
2. **packages/frontend/src/api/tauri-client.ts** - Created Tauri-specific client (backup)
3. **packages/frontend/src-tauri/tauri.conf.json** - Updated CSP and security settings
4. **packages/frontend/.env** - API URL configuration

## Next Steps

1. **Test the desktop app** using `start-frontend-desktop.bat`
2. **Check the console** for connection logs
3. **Try creating a bid** to test full functionality
4. **Report any errors** you see in the console

## Success Indicators

✅ Desktop app opens without errors  
✅ Console shows `[Tauri Mode]` messages  
✅ Bids and interviews load from backend  
✅ Can create new bids and interviews  
✅ No CORS or CSP errors in console  

## Still Having Issues?

If the desktop app still can't connect:

1. Share the console output (DevTools → Console)
2. Share any error messages
3. Confirm backend is running and accessible via `curl`
4. Try the web app (`start-frontend-web.bat`) to verify backend works
