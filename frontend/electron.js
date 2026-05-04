import { app, BrowserWindow } from 'electron';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendProcess;

function startBackend() {
  backendProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '../backend'),
    env: {
      ...process.env,
      USER_DATA_PATH: app.getPath('userData'),
      PORT: 5000
    },
    shell: true
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: { nodeIntegration: false }
  });

  // In production, load built React app
  win.loadFile(path.join(__dirname, 'dist/index.html'));
}

app.whenReady().then(() => {
  startBackend();
  setTimeout(createWindow, 2000); // wait for backend to start
});

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill();
  app.quit();
});
