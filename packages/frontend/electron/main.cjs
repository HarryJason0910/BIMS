const { app, BrowserWindow, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;
let tray;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = 3000;
const FRONTEND_PORT = 5173;

// Determine backend path
function getBackendPath() {
  if (isDev) {
    // Development: use the backend in the workspace
    return path.join(__dirname, '../../backend/dist/index.js');
  } else {
    // Production: use the bundled backend
    return path.join(process.resourcesPath, 'backend/dist/index.js');
  }
}

// Start the backend server
function startBackend() {
  const backendPath = getBackendPath();
  
  console.log('Starting backend from:', backendPath);
  
  if (!fs.existsSync(backendPath)) {
    console.error('Backend not found at:', backendPath);
    return;
  }

  // Set environment variables for backend
  const env = {
    ...process.env,
    PORT: BACKEND_PORT.toString(),
    NODE_ENV: isDev ? 'development' : 'production',
    CORS_ORIGIN: isDev ? `http://localhost:${FRONTEND_PORT}` : 'http://localhost:5173'
  };

  // Start backend process
  backendProcess = spawn('node', [backendPath], {
    env,
    stdio: 'inherit'
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backendProcess.on('exit', (code) => {
    console.log('Backend process exited with code:', code);
  });
}

// Stop the backend server
function stopBackend() {
  if (backendProcess) {
    console.log('Stopping backend...');
    backendProcess.kill();
    backendProcess = null;
  }
}

// Create the main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    icon: path.join(__dirname, '../build/icon.png'),
    show: false // Don't show until ready
  });

  // Load the frontend
  if (isDev) {
    mainWindow.loadURL(`http://localhost:${FRONTEND_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Create system tray
function createTray() {
  const iconPath = path.join(__dirname, '../build/icon.png');
  let trayIcon;
  
  if (fs.existsSync(iconPath)) {
    trayIcon = nativeImage.createFromPath(iconPath);
  } else {
    // Fallback: create a simple icon
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Job Bid Manager');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.isQuitting = true;
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ];

  if (isDev) {
    template.push({
      label: 'Developer',
      submenu: [
        { role: 'toggleDevTools' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App ready
app.whenReady().then(() => {
  console.log('App is ready');
  
  // Start backend first
  startBackend();
  
  // Wait for backend to start, then create window
  setTimeout(() => {
    createWindow();
    createTray();
    createMenu();
  }, isDev ? 1000 : 3000); // Wait longer in production

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.isQuitting = true;
    app.quit();
  }
});

// Clean up before quit
app.on('before-quit', () => {
  app.isQuitting = true;
  stopBackend();
});

app.on('will-quit', () => {
  stopBackend();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
});
