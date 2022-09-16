// Modules to control application life and create native browser window
const {app, BrowserWindow, protocol, ipcMain, dialog, Menu} = require('electron');

const fs = require('fs');
const AppData = require('./app-data');

const path = require('path');
const url = require('url');

var sizeOf = require('image-size');
ipcMain.on('size-of', (event, res0) => {
  const result = sizeOf(res0);
  event.returnValue = result;
});

const rimraf = require('rimraf');
ipcMain.on('rim-raf', (event, currentFile) => {
  rimraf(currentFile, (err) => {
    if (err) throw err;
  });
});

// https://github.com/micromatch/to-regex-range
const toRegexRange = require('to-regex-range');
ipcMain.on('toregex-range', (event, [acc, valname, valmin, valmax, theext]) => {
  event.returnValue = acc + valname + toRegexRange(valmin, valmax, {capture: true}) + theext;
});

ipcMain.on('show-dialog', (event, arg) => {
  let res = dialog.showOpenDialogSync({
    properties: [arg]
  });
  event.returnValue = res;
});

ipcMain.on('image-dialog', (event, arg) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile', 'multiSelections'],
    filters: [
        {name: 'Images(jpg)', extensions: ['jpg', 'JPG']},
        {name: 'Images(tif)', extensions: ['tif', 'TIF']},
        {name: 'All Files', extensions: ['*']}
    ]
  });
  event.returnValue = res;
});
ipcMain.on('video-dialog', (event, arg) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile'],
    filters: [
        {name: 'All Files', extensions: ['*']}
    ]
  });
  event.returnValue = res;
});

ipcMain.on('imagetif-dialog', (event, tempDir) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile'],
    defaultPath: tempDir,
    filters: [
        {name: 'Images(tif)', extensions: ['tif', 'TIF']},
        {name: 'All Files', extensions: ['*']}
    ]
  });
  event.returnValue = res;
});

ipcMain.on('savetif-dialog', (event, tempDir) => {
  let res = dialog.showSaveDialogSync({
    filters: [
      {name: 'Tiff(tif)', extensions: ['tif', 'TIF']}
    ]
  });
  event.returnValue = res;
});

ipcMain.on('savetext-dialog', (event, defaultPath) => {
  let res = dialog.showSaveDialogSync({
    filters: [
      {name: 'Measurements(txt)', extensions: ['txt', 'TXT']}
    ],
    defaultPath: defaultPath
  });
  event.returnValue = res;
});

ipcMain.on('savemesh-dialog', (event, defaultPath) => {
  let res = dialog.showSaveDialogSync({
    filters: [
      {name: 'GLTF(gltf)', extensions: ['gltf', 'GLTF']},
      {name: 'GLB(glb)', extensions: ['glb', 'GLB']},
      {name: 'Wavefront(obj)', extensions: ['obj', 'OBJ']},
      {name: 'Collada(dae)', extensions: ['dae', 'DAE']}
  ]
  });
  event.returnValue = res;
});


//repeat function ?
ipcMain.on('openply-dialog', (event, tempDir) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile'],
    defaultPath: tempDir,
    filters: [
      {name: 'Point Cloud', extensions: ['ply', 'PLY']},
      {name: 'All Files', extensions: ['*']}
  ]
  });
  event.returnValue = res;
});

ipcMain.on('openmeshply-dialog', (event, tempDir) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile'],
    defaultPath: tempDir,
    filters: [
      {name: 'Mesh(ply)', extensions: ['ply', 'PLY']}
  ]
  });
  event.returnValue = res;
});

ipcMain.on('openxml-dialog', (event, tempDir) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile'],
        filters: [
            {name: '2D Measurements(xml)', extensions: ['xml', 'XML']}
        ],
        defaultPath: tempDir
  });
  event.returnValue = res;
});

ipcMain.on('measuretext-dialog', (event, tempDir) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile'],
        filters: [
          {name: 'Measurements(txt)', extensions: ['txt', 'TXT']}
        ],
        defaultPath: tempDir
  });
  event.returnValue = res;
});

ipcMain.on('measurexml-dialog', (event, tempDir) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile'],
        filters: [
          {name: 'Measurements(xml)', extensions: ['xml', 'XML']}
        ],
        defaultPath: tempDir
  });
  event.returnValue = res;
});

ipcMain.on('opencsv-dialog', (event, arg) => {
  let res = dialog.showOpenDialogSync({
    properties: ['openFile'],
        filters: [
            {name: 'CSV(csv)', extensions: ['csv', 'CSV']},
            {name: 'All Files', extensions: ['*']}
        ]
  });
  event.returnValue = res;
});

const treekill = require('tree-kill');
ipcMain.on('tree-kill', (event, pid) => {
  treekill(pid);
});
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

//create temp folder
// const tempDir = path.join(app.getPath('temp'), 'micmacTemp');
const tempDir = path.join(app.getPath('home'), 'micmacTemp');
if(!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// application settings ...\AppData\Roaming\... for windows
const appData = new AppData({
  configName: 'app-settings',
  defaults: {
    mm3dPath: "mm3d",
    tempPath: tempDir,
    max3dpoints: "1234567",
    ffmpegPath: "ffmpeg"
}
});
exports.appData = appData;

ipcMain.on('get-setting', (event, key) => {
  event.returnValue = appData.get(key)
});

ipcMain.on('set-setting', (event, [key, value]) => {
  appData.set(key, value);
});

ipcMain.on('get-user-data-path', (event, arg) => {
  event.returnValue = app.getPath('userData');
});

function createWindow () {
  // Create the browser window.
  //had to disable security to load images
  //nativeWindowOpen to open plain javascript type window for help popup
  mainWindow = new BrowserWindow(
    {
      width: 1600, 
      height: 1024,
      icon: path.join(__dirname, 'icon512x512.png'),
      webPreferences: {
        webSecurity: false,
        contextIsolation: false,
        nodeIntegration: true,
        nativeWindowOpen: true
      },
      autoHideMenuBar: true,
      // frame: false
    })

  // and load the index.html of the app.
  //use webpack-dev-server instead
  //mainWindow.loadFile('index.html')
  //mainWindow.loadURL('http://localhost:3000');
  //changes so can run production via env variable in package.json
  const startUrl = process.env.ELECTRON_START_URL || url.format({
    pathname: path.join(__dirname, '/../build/index.html'),
    protocol: 'file:',
    slashes: true
  });
  mainWindow.loadURL(startUrl);

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  // console.log(process.env)

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const isMac = process.platform === 'darwin'

const template = [
  // { role: 'appMenu' }
  ...(isMac ? [{
    label: app.name,
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'services' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideOthers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }] : []),
  // { role: 'fileMenu' }
  // {
  //   label: 'File',
  //   submenu: [
  //     isMac ? { role: 'close' } : { role: 'quit' }
  //   ]
  // },
  // { role: 'editMenu' }
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac ? [
        { role: 'pasteAndMatchStyle' },
        { role: 'delete' },
        { role: 'selectAll' },
        { type: 'separator' },
        {
          label: 'Speech',
          submenu: [
            { role: 'startSpeaking' },
            { role: 'stopSpeaking' }
          ]
        }
      ] : [
        { role: 'delete' },
        { type: 'separator' },
        { role: 'selectAll' }
      ])
    ]
  },
  // { role: 'viewMenu' }
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  // { role: 'windowMenu' }
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'zoom' },
      ...(isMac ? [
        { type: 'separator' },
        { role: 'front' },
        { type: 'separator' },
        { role: 'window' }
      ] : [
        { role: 'close' }
      ])
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'About',
        // click: async () => {
          // const { shell } = require('electron')
          // await shell.openExternal('https://electronjs.org')
        click: () => {
          const {dialog} = require('electron');
          dialog.showMessageBox({ 
            title: "MicMac GUI",
            buttons: ['ok'],
            message: "MicMac Graphical User Interface\nVersion " + app.getVersion()
            });
        }

      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)