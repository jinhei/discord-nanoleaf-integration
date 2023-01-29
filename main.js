// Modules to control application life and create native browser window
const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
require('./electron/services');

const REACT_BUILD_DIR = './build';
const REACT_WEBPACK_URL = 'http://localhost:3000';

const ICON_PATH = path.join(__dirname, 'assets', 'icon.png');

function createWindow() {
  // Create the browser window.
  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    icon: ICON_PATH,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  // and load the page
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL(REACT_WEBPACK_URL);
  } else {
    mainWindow.loadFile(`${REACT_BUILD_DIR}/index.html`);
  }

  const createTray = () => {
    const tray = new Tray(ICON_PATH);
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => mainWindow.show(),
      },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);
    tray.setContextMenu(contextMenu);
    tray.setToolTip('Discord Nanoleaf');
    tray.on('double-click', () => {
      mainWindow.show();
    });
    return tray;
  };

  let tray = null;
  // Emitted when the window is closed.
  mainWindow.on('close', () => {
    mainWindow = null;
  });

  mainWindow.on('minimize', (e) => {
    e.preventDefault();
    mainWindow.hide();
    tray = createTray();
  });

  mainWindow.on('show', () => {
    tray.destroy();
  });

  // Open the DevTools.
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.hide();
    tray = createTray();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
