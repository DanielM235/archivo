/**
 * Electron API type definitions
 * These types are exposed to the renderer process via contextBridge
 */

interface IFileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

interface IElectronAPI {
  // File system operations
  readDirectory: (path: string) => Promise<IFileInfo[]>;
  renameFile: (oldPath: string, newPath: string) => Promise<void>;
  moveFile: (source: string, destination: string) => Promise<void>;
  copyFile: (source: string, destination: string) => Promise<void>;
  deleteFile: (path: string, recursive?: boolean) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  getInfo: (path: string) => Promise<IFileInfo | null>;
  createDirectory: (path: string, recursive?: boolean) => Promise<void>;

  // Dialog operations
  showOpenDialog: (options: Electron.OpenDialogOptions) => Promise<Electron.OpenDialogReturnValue>;
  showSaveDialog: (options: Electron.SaveDialogOptions) => Promise<Electron.SaveDialogReturnValue>;

  // App info
  getAppVersion: () => Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: IElectronAPI;
  }
}

export type { IFileInfo, IElectronAPI };
