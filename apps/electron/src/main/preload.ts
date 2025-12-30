import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose protected methods to the renderer process
 * via the contextBridge API
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // File system operations
  readDirectory: (path: string) => ipcRenderer.invoke('fs:readDirectory', path),
  renameFile: (oldPath: string, newPath: string) =>
    ipcRenderer.invoke('fs:renameFile', oldPath, newPath),
  moveFile: (source: string, destination: string) =>
    ipcRenderer.invoke('fs:moveFile', source, destination),
  copyFile: (source: string, destination: string) =>
    ipcRenderer.invoke('fs:copyFile', source, destination),
  deleteFile: (path: string, recursive?: boolean) =>
    ipcRenderer.invoke('fs:deleteFile', path, recursive),
  exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
  getInfo: (path: string) => ipcRenderer.invoke('fs:getInfo', path),
  createDirectory: (path: string, recursive?: boolean) =>
    ipcRenderer.invoke('fs:createDirectory', path, recursive),

  // Dialog operations
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:open', options),
  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('dialog:save', options),

  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
});
