# ⚡ Electron App - Quick Reference

## 🚀 Commands

### Development
```bash
cd packages/frontend
npm run electron:dev
```

### Build for Windows
```bash
build-electron-app.bat
# OR
cd packages/backend && npm run build
cd ../frontend && npm run electron:build:win
```

### Build for Other Platforms
```bash
npm run electron:build:mac    # macOS
npm run electron:build:linux  # Linux
npm run electron:build        # All platforms
```

## 📁 Important Files

| File | Purpose |
|------|---------|
| `packages/frontend/electron/main.cjs` | Main Electron process |
| `packages/frontend/package.json` | Electron configuration |
| `packages/frontend/release/` | Built installers |
| `packages/backend/dist/` | Compiled backend |

## 🔧 Common Tasks

### Update App Version
Edit `packages/frontend/package.json`:
```json
{
  "version": "1.0.1"
}
```

### Change App Name
Edit `packages/frontend/package.json`:
```json
{
  "productName": "Your App Name",
  "build": {
    "productName": "Your App Name"
  }
}
```

### Add Icons
Place in `packages/frontend/build/`:
- `icon.ico` (Windows)
- `icon.icns` (macOS)
- `icon.png` (Linux)

## 🐛 Quick Fixes

### Backend Not Starting
```bash
cd packages/backend
npm run build
```

### Port Already in Use
Edit `packages/frontend/electron/main.cjs`:
```javascript
const BACKEND_PORT = 3001; // Change port
```

### Clean Build
```bash
cd packages/frontend
rm -rf node_modules release dist
npm install
npm run electron:build:win
```

## 📦 Output Files

After building, find in `packages/frontend/release/`:

- **Windows**: `Job Bid Manager Setup X.X.X.exe`
- **Portable**: `Job Bid Manager X.X.X.exe`

## ✅ Pre-Build Checklist

- [ ] Backend is built (`packages/backend/dist/` exists)
- [ ] Frontend dependencies installed
- [ ] Icons added (optional)
- [ ] Version number updated
- [ ] App name customized (optional)

## 🎯 Testing Checklist

- [ ] App launches
- [ ] Backend connects
- [ ] All pages work (Bids, Interviews, Analytics)
- [ ] System tray works
- [ ] App closes properly
- [ ] Installer works

## 📊 Typical Sizes

- Installer: ~150-180 MB
- Installed: ~200-250 MB
- Portable: ~200 MB

## 🔗 Resources

- Full Guide: `ELECTRON_APP_GUIDE.md`
- Setup Complete: `ELECTRON_SETUP_COMPLETE.md`
- Electron Docs: https://electronjs.org

---

**Quick Start:** Run `build-electron-app.bat` and you're done! 🎉
