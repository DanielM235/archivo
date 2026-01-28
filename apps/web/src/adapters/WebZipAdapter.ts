import JSZip from 'jszip';
import type { IZipAdapter, IZipEntry } from '@archivo/shared';

// JSZip internal types
interface JSZipObject {
  name: string;
  dir: boolean;
  _data?: {
    uncompressedSize?: number;
    compressedSize?: number;
  };
  async(type: 'arraybuffer'): Promise<ArrayBuffer>;
}

/**
 * Web implementation of the ZipAdapter using JSZip
 * Uses streaming where possible to reduce memory usage
 */
export class WebZipAdapter implements IZipAdapter {
  /**
   * Read entries from a zip file
   * @param file - The zip File object
   * @returns Promise resolving to array of zip entries
   */
  async readZipEntries(file: File | string): Promise<IZipEntry[]> {
    if (typeof file === 'string') {
      throw new Error('WebZipAdapter does not support path strings. Use File object.');
    }

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const entries: IZipEntry[] = [];

    loadedZip.forEach((relativePath: string, zipEntry: JSZipObject) => {
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
   * Extract a single file from zip using streaming
   * @param file - The zip File object
   * @param entryName - Name of the entry to extract
   * @returns Promise resolving to the file data
   */
  async extractEntry(file: File | string, entryName: string): Promise<ArrayBuffer> {
    if (typeof file === 'string') {
      throw new Error('WebZipAdapter does not support path strings. Use File object.');
    }

    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const entry = loadedZip.file(entryName);

    if (!entry) {
      throw new Error(`Entry not found: ${entryName}`);
    }

    return entry.async('arraybuffer');
  }

  /**
   * Create a new zip file from entries using streaming compression
   * @param entries - Array of entries with their new names and data
   * @returns Promise resolving to the zip file as Blob
   */
  async createZip(entries: { name: string; data: ArrayBuffer | Uint8Array }[]): Promise<Blob> {
    const zip = new JSZip();

    for (const entry of entries) {
      zip.file(entry.name, entry.data);
    }

    // Use DEFLATE compression with optimal settings for memory efficiency
    return zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 6, // Balanced compression
      },
      streamFiles: true, // Enable streaming for better memory usage
    });
  }
}

/**
 * Singleton instance for web adapter
 */
let webZipAdapterInstance: WebZipAdapter | null = null;

/**
 * Get the singleton instance of WebZipAdapter
 */
export function getWebZipAdapter(): WebZipAdapter {
  if (!webZipAdapterInstance) {
    webZipAdapterInstance = new WebZipAdapter();
  }
  return webZipAdapterInstance;
}
