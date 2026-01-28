# 🚀 START HERE - Quick Launch Guide

## The Problem

Your system has PowerShell execution policy restrictions that prevent the original startup scripts from working. I've created simple batch files to fix this.

---

## ✅ Easiest Way to Start

### Just double-click this file:

```
start-all.bat
```

This will:
1. ✅ Check if everything is installed
2. ✅ Build the backend if needed
3. ✅ Create the frontend .env file if needed
4. ✅ Start the backend server (port 3000)
5. ✅ Start the frontend web server (port 5173)
6. ✅ Open two terminal windows for you

Then open your browser to: **http://localhost:5173**

---

## 📋 Alternative: Start Components Separately

If you want more control, use these individual batch files:

| File | What it does |
|------|--------------|
| `start-backend.bat` | Start only the backend API server |
| `start-frontend-web.bat` | Start only the web frontend |
| `start-frontend-desktop.bat` | Start the Tauri desktop app |

**Typical workflow:**
1. Double-click `start-backend.bat` (wait for "Server running on port 3000")
2. Double-click `start-frontend-web.bat` (wait for "Local: http://localhost:5173")
3. Open browser to http://localhost:5173

---

## 🔧 What Was Fixed

The connection issues between frontend and backend have been resolved:

✅ **Frontend .env file created** - Points to `http://localhost:3000`  
✅ **Backend CORS updated** - Allows web and desktop app origins  
✅ **Email integration disabled** - No more authentication errors  
✅ **Batch files created** - Work around PowerShell restrictions  

---

## 📁 Important Files

- **QUICK_START.md** - Detailed startup instructions and troubleshooting
- **DESKTOP_CONNECTION_FIX.md** - Connection troubleshooting guide
- **packages/frontend/.env** - Frontend API configuration
- **packages/backend/.env** - Backend server configuration

---

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Run `rebuild-backend.bat` to rebuild

### Frontend won't start
- Check if port 5173 is already in use
- Make sure `packages/frontend/.env` exists

### Can't connect to backend
- Verify backend is running (check the backend terminal window)
- Test: Open Command Prompt and run `curl http://localhost:3000/health`
- Should return: `{"status":"ok","timestamp":"..."}`

### Desktop app won't build
- Make sure Rust is installed: https://rustup.rs/
- Run `start-frontend-desktop.bat`

---

## 🎯 Next Steps

1. **Start the application** using `start-all.bat`
2. **Open your browser** to http://localhost:5173
3. **Test the features:**
   - Create a bid
   - Schedule an interview
   - View dashboards

---

## 💡 Development Tips

- Backend auto-reloads when you change code (using `npm run dev`)
- Frontend auto-reloads with Vite HMR
- Check browser console (F12) for any errors
- Check terminal windows for server logs

---

## 📚 More Documentation

- `BUILD_GUIDE.md` - How to build for production
- `FRONTEND_GUIDE.md` - Frontend development guide
- `PROJECT_STRUCTURE.md` - Project architecture
- `CONTRIBUTING.md` - Contribution guidelines

---

## ✨ You're All Set!

The application is ready to run. Just double-click **`start-all.bat`** and you're good to go! 🎉
