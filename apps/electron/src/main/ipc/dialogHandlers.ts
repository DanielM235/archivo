import { ipcMain, dialog, app, type BrowserWindow } from 'electron';

/**
 * Register dialog IPC handlers
 */
export function registerDialogHandlers(mainWindow: BrowserWindow): void {
  // Show open dialog
  ipcMain.handle(
    'dialog:open',
    async (
      _event,
      options: Electron.OpenDialogOptions
    ): Promise<Electron.OpenDialogReturnValue> => {
      return dialog.showOpenDialog(mainWindow, options);
    }
  );

  // Show save dialog
  ipcMain.handle(
    'dialog:save',
    async (
      _event,
      options: Electron.SaveDialogOptions
    ): Promise<Electron.SaveDialogReturnValue> => {
      return dialog.showSaveDialog(mainWindow, options);
    }
  );

  // Get app version
  ipcMain.handle('app:version', (): string => {
    return app.getVersion();
  });
}
