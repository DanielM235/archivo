/**
 * Represents a file or directory entry
 */
export interface IFileEntry {
  /**
   * Name of the file or directory
   */
  name: string;

  /**
   * Full path to the file or directory
   */
  path: string;

  /**
   * Type of entry
   */
  type: 'file' | 'directory';

  /**
   * Size in bytes (for files)
   */
  size?: number;

  /**
   * Last modified date
   */
  modifiedAt?: Date;

  /**
   * Creation date
   */
  createdAt?: Date;

  /**
   * File extension (for files)
   */
  extension?: string;

  /**
   * Whether the entry is hidden
   */
  isHidden?: boolean;

  /**
   * Whether the entry is read-only
   */
  isReadOnly?: boolean;
}
