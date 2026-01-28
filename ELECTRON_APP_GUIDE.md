# 🚀 Job Bid Manager - Electron Desktop App

A complete desktop application that bundles both frontend and backend into a single executable.

## ✨ Features

- 📦 **Standalone Desktop App** - No browser or separate server needed
- 🖥️ **Cross-Platform** - Windows, macOS, and Linux support
- 🔔 **System Tray Integration** - Minimize to tray, quick access
- 💾 **Bundled Backend** - Backend server runs automatically
- 🎨 **Native Look & Feel** - Proper desktop application experience
- 🔒 **Secure** - Context isolation and sandboxed renderer

## 📋 Prerequisites

Before building the Electron app, ensure you have:

1. **Node.js** (v18 or higher)
2. **npm** (v9 or higher)
3. **Backend built** - The backend must be compiled first

## 🛠️ Installation

### Step 1: Install Dependencies

```bash
# Install frontend dependencies (includes Electron)
cd packages/frontend
npm install

# Install backend dependencies (if not already done)
cd ../backend
npm install
```

### Step 2: Build Backend

The Electron app needs the compiled backend:

```bash
cd packages/backend
npm run build
```

This creates `packages/backend/dist/` with compiled JavaScript files.

## 🚀 Development

### Run in Development Mode

```bash
cd packages/frontend
npm run electron:dev
```

This will:
1. Start the Vite dev server (frontend)
2. Wait for it to be ready
3. Launch Electron with the dev server
4. Start the backend server automatically

**Features in Dev Mode:**
- Hot reload for frontend changes
- DevTools open by default
- Backend runs from `packages/backend/dist/`

### Development Tips

- Frontend changes reload automatically
- Backend changes require rebuilding: `cd packages/backend && npm run build`
- Check console for backend logs
- Use DevTools (F12) for frontend debugging

## 📦 Building for Production

### Build for Your Platform

```bash
cd packages/frontend

# Build for Windows
npm run electron:build:win

# Build for macOS
npm run electron:build:mac

# Build for Linux
npm run electron:build:linux

# Build for all platforms
npm run electron:build
```

### Build Output

Installers will be created in `packages/frontend/release/`:

**Windows:**
- `Job Bid Manager Setup X.X.X.exe` - NSIS installer
- `Job Bid Manager X.X.X.exe` - Portable version (no installation)

**macOS:**
- `Job Bid Manager-X.X.X.dmg` - DMG installer
- `Job Bid Manager-X.X.X-mac.zip` - ZIP archive

**Linux:**
- `Job Bid Manager-X.X.X.AppImage` - Universal Linux app
- `job-bid-manager_X.X.X_amd64.deb` - Debian/Ubuntu package

## 🎨 Customization

### Application Icons

Add your custom icons to `packages/frontend/build/`:

1. **Windows**: `icon.ico` (256x256 pixels)
2. **macOS**: `icon.icns` (512x512 pixels)
3. **Linux**: `icon.png` (512x512 pixels)

**Tools for Icon Creation:**
- [IcoConverter](https://www.icoconverter.com/) - Create .ico files
- [CloudConvert](https://cloudconvert.com/png-to-icns) - Create .icns files
- Any image editor for .png

### App Configuration

Edit `packages/frontend/package.json` to customize:

```json
{
  "build": {
    "appId": "com.yourcompany.jobbidmanager",
    "productName": "Your App Name",
    "copyright": "Copyright © 2024 Your Company"
  }
}
```

## 🔧 Troubleshooting

### Backend Not Starting

**Problem:** Electron opens but shows connection errors

**Solutions:**
1. Ensure backend is built: `cd packages/backend && npm run build`
2. Check if `packages/backend/dist/index.js` exists
3. Look for backend errors in the Electron console

### Build Fails

**Problem:** `electron-builder` fails during build

**Solutions:**
1. Ensure all dependencies are installed: `npm install`
2. Build backend first: `cd packages/backend && npm run build`
3. Clear cache: `npm run build -- --clean`
4. Check disk space (builds can be large)

### App Won't Start After Build

**Problem:** Installed app doesn't launch

**Solutions:**
1. Check if antivirus is blocking it
2. Run from command line to see errors
3. Ensure backend files are included in build

### Port Already in Use

**Problem:** Backend port 3000 is already taken

**Solution:** Close other apps using port 3000, or modify the port in `electron/main.cjs`:

```javascript
const BACKEND_PORT = 3001; // Change to available port
```

## 📁 Project Structure

```
packages/
├── frontend/
│   ├── electron/
│   │   ├── main.cjs          # Electron main process
│   │   └── preload.cjs       # Preload script
│   ├── build/
│   │   └── icon.*            # Application icons
│   ├── dist/                 # Built frontend (after npm run build)
│   ├── src/                  # React source code
│   └── package.json          # Electron config
└── backend/
    ├── dist/                 # Built backend (after npm run build)
    ├── src/                  # Backend source code
    └── package.json
```

## 🎯 How It Works

### Application Flow

1. **Electron Starts**
   - `electron/main.cjs` is executed
   - Creates the main window
   - Starts the backend server

2. **Backend Launches**
   - Node.js spawns backend process
   - Backend runs on `http://localhost:3000`
   - Express server starts with all routes

3. **Frontend Loads**
   - In dev: Loads from Vite dev server (`http://localhost:5173`)
   - In prod: Loads from `dist/index.html`
   - React app connects to backend API

4. **User Interaction**
   - User interacts with React UI
   - API calls go to `http://localhost:3000`
   - Backend processes requests and returns data

### Backend Integration

The backend is bundled with the app:

- **Development**: Uses `packages/backend/dist/`
- **Production**: Copied to `app.asar.unpacked/backend/`

Backend starts automatically when Electron launches and stops when the app closes.

## 🚀 Distribution

### Windows

**NSIS Installer:**
- Users run the installer
- App installs to Program Files
- Desktop and Start Menu shortcuts created
- Uninstaller included

**Portable:**
- Single .exe file
- No installation required
- Run from any location
- Perfect for USB drives

### macOS

**DMG:**
- Users open the DMG
- Drag app to Applications folder
- Eject DMG
- Launch from Applications

### Linux

**AppImage:**
- Make executable: `chmod +x Job-Bid-Manager-X.X.X.AppImage`
- Run: `./Job-Bid-Manager-X.X.X.AppImage`
- No installation needed

**DEB Package:**
- Install: `sudo dpkg -i job-bid-manager_X.X.X_amd64.deb`
- Run from applications menu

## 📊 App Size

Expected application sizes:

- **Windows**: ~150-180 MB (installer), ~200 MB (installed)
- **macOS**: ~160-190 MB (DMG)
- **Linux**: ~150-180 MB (AppImage)

Size includes:
- Electron runtime (~100 MB)
- Node.js runtime
- Backend code and dependencies
- Frontend code
- Application assets

## 🔐 Security

The app implements security best practices:

- ✅ **Context Isolation** - Renderer process is isolated
- ✅ **Sandbox** - Renderer runs in sandbox
- ✅ **No Node Integration** - Renderer can't access Node.js
- ✅ **Secure IPC** - Communication via context bridge
- ✅ **HTTPS Ready** - Can be configured for HTTPS

## 🎉 Features

### System Tray

- Minimize to system tray
- Quick access menu
- Close to tray instead of quit

### Application Menu

- File, Edit, View, Window menus
- Keyboard shortcuts
- Native menu integration

### Auto-Start Backend

- Backend starts automatically
- No manual server management
- Stops when app closes

### Cross-Platform

- Single codebase
- Platform-specific builds
- Native installers

## 📝 Next Steps

After building your app:

1. **Test Thoroughly**
   - Install on clean machine
   - Test all features
   - Check backend connectivity

2. **Add Icons**
   - Create professional icons
   - Add to `build/` folder
   - Rebuild app

3. **Code Signing** (Optional)
   - Windows: Get code signing certificate
   - macOS: Apple Developer account
   - Prevents security warnings

4. **Auto-Updates** (Future)
   - Implement electron-updater
   - Host updates on server
   - Automatic update checks

## 🆘 Support

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review Electron logs in console
3. Check backend logs
4. Verify all dependencies are installed

## 🎊 Success!

You now have a complete desktop application! 🚀

Your users can:
- Download a single installer
- Install with one click
- Use without any technical setup
- Enjoy a native desktop experience

---

**Built with:**
- ⚛️ React + TypeScript
- 🎨 Material-UI
- ⚡ Vite
- 🖥️ Electron
- 🚀 Node.js + Express
