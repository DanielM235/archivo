import JSZip from 'jszip';
import type { IZipAdapter, IZipEntry } from '@archivo/shared';

/**
 * Electron renderer implementation of the ZipAdapter using JSZip
 * Works similarly to web version but could be extended to use IPC
 * for node.js-based operations if needed
 */
export class ElectronZipAdapter implements IZipAdapter {
  /**
   * Read entries from a zip file
   * @param file - The zip File object or path string
   * @returns Promise resolving to array of zip entries
   */
  async readZipEntries(file: File | string): Promise<IZipEntry[]> {
    let data: ArrayBuffer;

    if (typeof file === 'string') {
      // In Electron, we could use IPC to read from filesystem
      // For now, throw an error as we use File objects in renderer
      throw new Error(
        'Path strings not supported in renderer. Use File object or implement IPC handler.'
      );
    } else {
      data = await file.arrayBuffer();
    }

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(data);
    const entries: IZipEntry[] = [];

    loadedZip.forEach((relativePath, zipEntry) => {
      entries.push({
        name: relativePath,
        isDirectory: zipEntry.dir,
        size: zipEntry._data?.uncompressedSize || 0,
        compressedSize: zipEntry._data?.compressedSize || 0,
      });
    });

    return entries;
  }

  /**
   * Extract a single file from zip
   * @param file - The zip File object or path string
   * @param entryName - Name of the entry to extract
   * @returns Promise resolving to the file data
   */
  async extractEntry(file: File | string, entryName: string): Promise<ArrayBuffer> {
    let data: ArrayBuffer;

    if (typeof file === 'string') {
      throw new Error(
        'Path strings not supported in renderer. Use File object or implement IPC handler.'
      );
    } else {
      data = await file.arrayBuffer();
    }

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(data);
    const entry = loadedZip.file(entryName);

    if (!entry) {
      throw new Error(`Entry not found: ${entryName}`);
    }

    return entry.async('arraybuffer');
  }

  /**
   * Create a new zip file from entries
   * @param entries - Array of entries with their new names and data
   * @returns Promise resolving to the zip file as Blob
   */
  async createZip(entries: { name: string; data: ArrayBuffer | Uint8Array }[]): Promise<Blob> {
    const zip = new JSZip();

    for (const entry of entries) {
      zip.file(entry.name, entry.data);
    }

    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6,
      },
      streamFiles: true,
    });
  }
}

/**
 * Singleton instance
 */
let electronZipAdapterInstance: ElectronZipAdapter | null = null;

/**
 * Get the singleton instance of ElectronZipAdapter
 */
export function getElectronZipAdapter(): ElectronZipAdapter {
  if (!electronZipAdapterInstance) {
    electronZipAdapterInstance = new ElectronZipAdapter();
  }
  return electronZipAdapterInstance;
}
