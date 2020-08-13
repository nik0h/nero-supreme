const { app, BrowserWindow, ipcMain } = require('electron');

let mainWindow;
let splash;
let captchaWindow;
let captchaUnlocked = 0;

app.on('ready', () => {
  mainWindow = new BrowserWindow({
    height: 600,
    width: 1000,
    frame: false,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true
    }
  });

  captchaWindow = new BrowserWindow({
    width: 500,
    height: 620,
    frame: false,
    resizable: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true
    }
  });

  splash = new BrowserWindow({
    width: 400,
    height: 350,
    resizable: false,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true
    }
  });
  
  splash.loadURL('file://' + __dirname + '/html/splash.html');
  mainWindow.loadURL('file://' + __dirname + '/html/index.html');
  captchaWindow.loadURL('file://' + __dirname + '/html/captcha.html');

  mainWindow.once('ready-to-show', () => {
    splash.destroy();
    mainWindow.show();
  });

  ipcMain.on('captcha', (event, arg) => {
    mainWindow.webContents.send('captcha', arg);
  });

  ipcMain.on('hideCaptcha', (event, arg) => {
    captchaWindow.hide();
  });

  ipcMain.on('showCaptcha', (event, arg) => {
    captchaWindow.show();
  });

  ipcMain.on('captchaStart', (event, arg) => {
    if(captchaUnlocked == 0){
      captchaUnlocked = arg;
      captchaWindow.webContents.send('captchaStart', arg);
    }
  });

  ipcMain.on('exit', (event, arg) => {
    app.quit();
  });

});
