# Quick Start Guide

## PowerShell Execution Policy Issue

Your system has PowerShell execution policy restrictions that prevent npm from running. I've created batch files to work around this.

## Starting the Application

### Option 1: Web Application (Recommended for Testing)

**Step 1: Start the Backend**

Double-click `start-backend.bat` or run in Command Prompt:
```cmd
start-backend.bat
```

Wait until you see:
```
Server running on port 3000
CORS enabled for origins: http://localhost:5173, tauri://localhost, http://tauri.localhost
```

**Step 2: Start the Frontend Web Server**

Double-click `start-frontend-web.bat` or run in Command Prompt:
```cmd
start-frontend-web.bat
```

Wait until you see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**Step 3: Open Your Browser**

Navigate to: `http://localhost:5173`

---

### Option 2: Desktop Application (Tauri)

**Step 1: Start the Backend**

Same as above - run `start-backend.bat`

**Step 2: Start the Desktop App**

Double-click `start-frontend-desktop.bat` or run in Command Prompt:
```cmd
start-frontend-desktop.bat
```

**Note:** First run will take 1-2 minutes to compile Rust code. Subsequent runs are much faster.

---

## Alternative: Use the Original Scripts

If you want to use the original `start.bat` or `start-web.bat` scripts, you need to fix the PowerShell execution policy:

### Fix PowerShell Execution Policy

Open PowerShell **as Administrator** and run:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then you can use:
- `start-web.bat` - Start backend + web frontend
- `start.bat` - Start backend + desktop app

---

## Troubleshooting

### Backend won't start

**Error: "Port 3000 is already in use"**
- Another process is using port 3000
- Solution: Close other applications or change the port in `packages/backend/.env`

**Error: "Cannot find module"**
- Dependencies not installed
- Solution: Run `npm install` in the root directory

### Frontend won't start

**Error: "Port 5173 is already in use"**
- Another Vite server is running
- Solution: Close other Vite instances or change port in `packages/frontend/vite.config.ts`

**Error: "npm: command not found"**
- Node.js not installed or not in PATH
- Solution: Install Node.js 22+ from https://nodejs.org/

### Desktop app won't build

**Error: "Rust not found"**
- Rust toolchain not installed
- Solution: Install Rust from https://rustup.rs/

**Error: "Tauri build failed"**
- Check if backend is running
- Check `packages/frontend/.env` exists with correct API URL
- Try rebuilding: `npm run build` in packages/frontend

### Connection Issues

**Frontend shows "No response from server"**

1. Verify backend is running:
   ```cmd
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

2. Check `packages/frontend/.env` exists and contains:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. Check browser console (F12) for CORS errors

4. Verify backend CORS configuration in `packages/backend/.env`:
   ```
   CORS_ORIGIN=http://localhost:5173,tauri://localhost,http://tauri.localhost
   ```

---

## File Structure

```
BIMS/
├── start-backend.bat           ← Start backend API server
├── start-frontend-web.bat      ← Start web frontend
├── start-frontend-desktop.bat  ← Start desktop app
├── rebuild-backend.bat         ← Rebuild backend after changes
├── packages/
│   ├── backend/
│   │   ├── .env               ← Backend configuration
│   │   ├── dist/              ← Compiled backend code
│   │   └── src/               ← Backend source code
│   └── frontend/
│       ├── .env               ← Frontend configuration (API URL)
│       ├── dist/              ← Built web app
│       └── src/               ← Frontend source code
```

---

## Development Workflow

1. **Make changes to backend code**
   - Edit files in `packages/backend/src/`
   - Backend will auto-reload (if using `npm run dev`)
   - Or rebuild: `rebuild-backend.bat`

2. **Make changes to frontend code**
   - Edit files in `packages/frontend/src/`
   - Frontend will auto-reload (Vite HMR)

3. **Test your changes**
   - Web: Refresh browser at `http://localhost:5173`
   - Desktop: Restart the Tauri app

---

## Production Build

To build for production:

```cmd
build.bat
```

This will:
1. Build the backend to `packages/backend/dist/`
2. Build the frontend to `packages/frontend/dist/`
3. Build the desktop app to `packages/frontend/src-tauri/target/release/`

---

## Need Help?

- Check `DESKTOP_CONNECTION_FIX.md` for connection troubleshooting
- Check `BUILD_GUIDE.md` for build instructions
- Check `FRONTEND_GUIDE.md` for frontend development guide
