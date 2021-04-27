const { ipcMain, BrowserWindow } = require('electron');

ipcMain.handle('electron-icon-overlay', (event, icon) => {
  BrowserWindow.getAllWindows().forEach((w) => {
    w.setOverlayIcon(icon ? `./assets/icons/${icon}.png` : null, icon || '');
  });
});
