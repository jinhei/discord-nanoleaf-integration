const { ipcMain } = require('electron');
const Api = require('../models/nanoleaf');

let api;

ipcMain.handle('nanoleaf-construct', (event, { ipAddress, authToken }) => {
  api = new Api({ ipAddress, authToken });
})

ipcMain.handle('nanoleaf-getScenes', () => api.getScenes())

ipcMain.handle('nanoleaf-setScene', (event, scene) => api.setScene(scene));
