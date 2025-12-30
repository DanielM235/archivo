import type { IFileEntry } from './IFileEntry';

/**
 * Interface for file system operations
 * Implementations differ between Web (File System Access API) and Electron (Node.js fs)
 */
export interface IFileSystemAdapter {
  /**
   * Read the contents of a directory
   * @param path - Path to the directory
   * @returns Promise resolving to array of file entries
   */
  readDirectory(path: string): Promise<IFileEntry[]>;

  /**
   * Rename a file or directory
   * @param oldPath - Current path
   * @param newPath - New path
   */
  renameFile(oldPath: string, newPath: string): Promise<void>;

  /**
   * Move a file or directory to a new location
   * @param source - Source path
   * @param destination - Destination path
   */
  moveFile(source: string, destination: string): Promise<void>;

  /**
   * Copy a file or directory
   * @param source - Source path
   * @param destination - Destination path
   */
  copyFile(source: string, destination: string): Promise<void>;

  /**
   * Delete a file or directory
   * @param path - Path to delete
   * @param recursive - If true, delete directories recursively
   */
  deleteFile(path: string, recursive?: boolean): Promise<void>;

  /**
   * Check if a path exists
   * @param path - Path to check
   */
  exists(path: string): Promise<boolean>;

  /**
   * Get file or directory information
   * @param path - Path to get info for
   */
  getInfo(path: string): Promise<IFileEntry>;

  /**
   * Create a directory
   * @param path - Path of directory to create
   * @param recursive - If true, create parent directories as needed
   */
  createDirectory(path: string, recursive?: boolean): Promise<void>;
}
