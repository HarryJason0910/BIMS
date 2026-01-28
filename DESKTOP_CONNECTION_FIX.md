# Desktop App Connection Fix

## Problem
The Tauri desktop app and web app are not connecting to the backend because:
1. Backend CORS configuration needs to support multiple origins
2. Backend needs to be rebuilt with the new configuration
3. Frontend needs a `.env` file to specify the API URL

## Solution

### Quick Fix (Using Batch Files)

**PowerShell execution policy is blocking npm commands.** Use these batch files instead:

1. **Start Backend:** Double-click `start-backend.bat`
2. **Start Web Frontend:** Double-click `start-frontend-web.bat`
3. **Start Desktop App:** Double-click `start-frontend-desktop.bat`

### Manual Fix (Command Prompt)

If you prefer using Command Prompt directly:

**Step 1: Rebuild the Backend**

```cmd
cd packages\backend
npm run build
```

**Step 2: Start the Backend**

```cmd
npm start
```

Or use development mode:

```cmd
npm run dev
```

You should see:
```
Server running on port 3000
CORS enabled for origins: http://localhost:5173, tauri://localhost, http://tauri.localhost
```

**Step 3: Test the Backend**

Open a new Command Prompt:

```cmd
curl http://localhost:3000/health
```

You should see: `{"status":"ok","timestamp":"..."}`

**Step 4: Start the Web App**

Open a new Command Prompt:

```cmd
cd packages\frontend
npm run dev
```

The web app will open at `http://localhost:5173` and should connect to the backend.

**Step 5: Build and Run Desktop App**

To build the desktop app:

```cmd
cd packages\frontend
npm run tauri build
```

The built app will be in `packages/frontend/src-tauri/target/release/`

### Fix PowerShell Execution Policy (Optional)

To use the original `start.bat` and `start-web.bat` scripts, open PowerShell **as Administrator**:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Files Modified

1. **packages/frontend/.env** - Created with API URL
2. **packages/backend/.env** - Updated CORS to support multiple origins
3. **packages/backend/src/infrastructure/server.ts** - Updated to parse multiple CORS origins
4. **packages/frontend/src-tauri/tauri.conf.json** - Added 127.0.0.1 to HTTP scope

## Troubleshooting

### Backend won't start
- Make sure no other process is using port 3000
- Check `packages/backend/.env` exists
- Try rebuilding: `npm run build` in packages/backend

### Frontend can't connect
- Verify backend is running on port 3000
- Check `packages/frontend/.env` has `VITE_API_BASE_URL=http://localhost:3000`
- Clear browser cache and reload

### Desktop app can't connect
- Ensure backend is running
- Check Tauri console for errors (open DevTools in the app)
- Verify `tauri.conf.json` has correct HTTP scope

## Quick Start Scripts

Use the provided batch files:

- **start-web.bat** - Start backend + web frontend
- **start.bat** - Start backend + desktop app (requires Rust)
- **build.bat** - Build both backend and frontend

## Email Integration (Optional)

The email integration is currently disabled. To enable it:

1. Get Microsoft Graph API credentials
2. Edit `packages/backend/.env`:
   ```
   GRAPH_CLIENT_ID=your-real-client-id
   GRAPH_CLIENT_SECRET=your-real-client-secret
   GRAPH_TENANT_ID=your-real-tenant-id
   GRAPH_USER_EMAIL=your-email@example.com
   ```
3. Restart the backend
