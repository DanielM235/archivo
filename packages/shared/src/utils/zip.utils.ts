import type { IRenameFileInfo } from '../interfaces/IRenameConfig';

/**
 * Interface for zip entry data
 */
export interface IZipEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  compressedSize: number;
  data?: ArrayBuffer | Uint8Array;
}

/**
 * Interface for zip adapter (platform-specific implementation)
 */
export interface IZipAdapter {
  /**
   * Read entries from a zip file
   * @param file - The zip file (File object for web, path for electron)
   * @returns Promise resolving to array of zip entries
   */
  readZipEntries(file: File | string): Promise<IZipEntry[]>;

  /**
   * Extract a single file from zip
   * @param file - The zip file
   * @param entryName - Name of the entry to extract
   * @returns Promise resolving to the file data
   */
  extractEntry(file: File | string, entryName: string): Promise<ArrayBuffer>;

  /**
   * Create a new zip file from entries
   * @param entries - Array of entries with their new names and data
   * @returns Promise resolving to the zip file as Blob
   */
  createZip(entries: { name: string; data: ArrayBuffer | Uint8Array }[]): Promise<Blob>;
}

/**
 * Zip utility functions
 * Static methods for zip file manipulation
 */
export class ZipUtils {
  private static adapter: IZipAdapter | null = null;

  /**
   * Set the zip adapter (call this during app initialization)
   * @param adapter - The platform-specific zip adapter
   */
  static setAdapter(adapter: IZipAdapter): void {
    this.adapter = adapter;
  }

  /**
   * Get the current adapter
   * @returns The current zip adapter
   * @throws Error if adapter is not set
   */
  static getAdapter(): IZipAdapter {
    if (!this.adapter) {
      throw new Error('Zip adapter not initialized. Call ZipUtils.setAdapter() first.');
    }
    return this.adapter;
  }

  /**
   * Check if adapter is available
   * @returns True if adapter is set
   */
  static hasAdapter(): boolean {
    return this.adapter !== null;
  }

  /**
   * Convert zip entries to file info objects
   * @param entries - Array of zip entries
   * @returns Array of file info objects
   */
  static entriesToFileInfo(entries: IZipEntry[]): IRenameFileInfo[] {
    return entries
      .filter((entry) => !entry.isDirectory)
      .map((entry) => {
        const pathParts = entry.name.split('/');
        const filename = pathParts[pathParts.length - 1] ?? '';
        const dotIndex = filename.lastIndexOf('.');
        const extension = dotIndex > 0 ? filename.slice(dotIndex + 1).toLowerCase() : '';
        const nameWithoutExtension = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;

        return {
          id: crypto.randomUUID(),
          originalName: filename,
          originalPath: entry.name,
          extension,
          size: entry.size,
          nameWithoutExtension,
          newName: null,
        };
      })
      .filter((entry) => entry.originalName.length > 0);
  }

  /**
   * Create a download trigger for a blob
   * @param blob - The blob to download
   * @param filename - The filename for download
   */
  static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Get the suggested output filename
   * @param originalName - Original zip filename
   * @returns Suggested output filename
   */
  static getOutputFilename(originalName: string): string {
    const dotIndex = originalName.lastIndexOf('.');
    const baseName = dotIndex > 0 ? originalName.slice(0, dotIndex) : originalName;
    return `${baseName}_renamed.zip`;
  }
}
