import { ipcMain } from 'electron';
import fs from 'fs/promises';
import path from 'path';

/**
 * File info interface
 */
interface IFileInfo {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
}

/**
 * Register file system IPC handlers
 */
export function registerFileSystemHandlers(): void {
  // Read directory contents
  ipcMain.handle('fs:readDirectory', async (_event, dirPath: string): Promise<IFileInfo[]> => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: IFileInfo[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stats = await fs.stat(fullPath);
        results.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        });
      } catch {
        // Skip files we can't access
      }
    }

    return results;
  });

  // Rename file
  ipcMain.handle(
    'fs:renameFile',
    async (_event, oldPath: string, newPath: string): Promise<void> => {
      await fs.rename(oldPath, newPath);
    }
  );

  // Move file
  ipcMain.handle(
    'fs:moveFile',
    async (_event, source: string, destination: string): Promise<void> => {
      await fs.rename(source, destination);
    }
  );

  // Copy file
  ipcMain.handle(
    'fs:copyFile',
    async (_event, source: string, destination: string): Promise<void> => {
      await fs.copyFile(source, destination);
    }
  );

  // Delete file
  ipcMain.handle(
    'fs:deleteFile',
    async (_event, filePath: string, recursive = false): Promise<void> => {
      await fs.rm(filePath, { recursive, force: true });
    }
  );

  // Check if file exists
  ipcMain.handle('fs:exists', async (_event, filePath: string): Promise<boolean> => {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  });

  // Get file info
  ipcMain.handle('fs:getInfo', async (_event, filePath: string): Promise<IFileInfo | null> => {
    try {
      const stats = await fs.stat(filePath);
      return {
        name: path.basename(filePath),
        path: filePath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch {
      return null;
    }
  });

  // Create directory
  ipcMain.handle(
    'fs:createDirectory',
    async (_event, dirPath: string, recursive = true): Promise<void> => {
      await fs.mkdir(dirPath, { recursive });
    }
  );
}
