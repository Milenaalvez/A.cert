// A.CERT Electron Main Process — Self-contained
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import spawn from 'cross-spawn';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const isDev = !app.isPackaged;

let mainWindow = null;
let backendProcess = null;
let frontendProcess = null;

function startProcess(cmd, args, label, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: cwd || rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: isDev ? 'development' : 'production' },
    });

    let started = false;
    const check = (data) => {
      const text = data.toString();
      if (!started && (text.includes('3000') || text.includes('3001') || text.includes('ready'))) {
        started = true;
        console.log(`[A.CERT] ${label} ready`);
        resolve(child);
      }
    };
    child.stdout.on('data', check);
    child.stderr.on('data', (d) => {
      if (!started) console.log(`[${label}]`, d.toString().trim());
      check(d);
    });
    child.on('error', (e) => { console.error(`[${label}] err:`, e.message); if (!started) resolve(child); });
    setTimeout(() => { if (!started) { console.log(`[A.CERT] ${label} fallback`); resolve(child); } }, 8000);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900,
    minWidth: 1024, minHeight: 700,
    title: 'A.CERT — Certidões Imobiliárias',
    icon: path.join(rootDir, 'frontend', 'public', 'images', 'logo.png'),
    frame: false,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.mjs'),
    },
    show: false,
  });
  Menu.setApplicationMenu(null);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  // Show loading page while servers start
  mainWindow.loadFile(path.join(__dirname, 'loading.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  console.log('[A.CERT] Starting services...');
  
  if (isDev) {
    // Dev: assume backend and frontend already running from dev:fresh
    console.log('[A.CERT] Dev mode — using existing dev servers');
    setTimeout(createWindow, 500);
  } else {
    // Production: start Express then Next.js
    backendProcess = await startProcess('node', ['dist/server.js'], 'Backend');
    await new Promise(r => setTimeout(r, 1500));
    // Start Next.js using the local binary (npx not available in packaged app)
    const nextBin = path.join(rootDir, 'frontend', 'node_modules', 'next', 'dist', 'bin', 'next');
    frontendProcess = await startProcess('node', [nextBin, 'start', '--port', '3000'], 'Frontend', path.join(rootDir, 'frontend'));
    await new Promise(r => setTimeout(r, 1000));
    createWindow();
  }
});

app.on('window-all-closed', () => {
  [backendProcess, frontendProcess].forEach(p => { try { p?.kill(); } catch {} });
  app.quit();
});

ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize();
  return mainWindow?.isMaximized();
});
ipcMain.handle('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized());
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-user-data-path', () => app.getPath('userData'));
