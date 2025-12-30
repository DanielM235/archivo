import type { DateFormatPattern } from '../utils/date.utils';

/**
 * Separator options for renamed files
 */
export type SeparatorType = '_' | '-' | ' ' | '';

/**
 * Order of components in the new filename
 */
export type NameOrderType = 'date-name' | 'name-date';

/**
 * Information about a file to be renamed
 */
export interface IRenameFileInfo {
  /**
   * Unique identifier for the file
   */
  id: string;

  /**
   * Original filename (with extension)
   */
  originalName: string;

  /**
   * Original path within the archive or folder
   */
  originalPath: string;

  /**
   * File extension (without dot)
   */
  extension: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * Filename without extension
   */
  nameWithoutExtension: string;

  /**
   * New filename (with extension) after renaming
   * Null if not yet calculated
   */
  newName: string | null;

  /**
   * Extracted date from the original filename
   */
  extractedDate?: Date | null;

  /**
   * The name part extracted from original filename (without date)
   */
  extractedName?: string;

  /**
   * Error message if renaming failed for this file
   */
  error?: string;
}

/**
 * Configuration for the rename operation
 */
export interface IRenameConfig {
  /**
   * Source date format pattern
   */
  sourceDateFormat: DateFormatPattern;

  /**
   * Target date format pattern
   */
  targetDateFormat: DateFormatPattern;

  /**
   * Order of date and name in the new filename
   */
  nameOrder: NameOrderType;

  /**
   * Separator between date and name
   */
  separator: SeparatorType;

  /**
   * Custom name to replace the extracted name from the original filename
   * If empty, the extracted name from the original filename will be used
   */
  customName?: string;
}

/**
 * State of the rename process
 */
export type RenameProcessState =
  | 'idle'
  | 'selecting'
  | 'loaded'
  | 'previewing'
  | 'renaming'
  | 'completed'
  | 'error';

/**
 * Result of a rename operation
 */
export interface IRenameResult {
  /**
   * Whether the operation was successful
   */
  success: boolean;

  /**
   * Number of files successfully renamed
   */
  renamedCount: number;

  /**
   * Number of files that failed to rename
   */
  errorCount: number;

  /**
   * The resulting zip blob (for download)
   */
  outputBlob?: Blob;

  /**
   * Error message if the operation failed
   */
  error?: string;
}

/**
 * Default rename configuration
 */
export const DEFAULT_RENAME_CONFIG: IRenameConfig = {
  sourceDateFormat: 'YYYYMMDD',
  targetDateFormat: 'YYMMDD',
  nameOrder: 'date-name',
  separator: '_',
};

/**
 * Available separator options
 */
export const SEPARATOR_OPTIONS: { value: SeparatorType; label: string }[] = [
  { value: '_', label: 'Underscore (_)' },
  { value: '-', label: 'Hyphen (-)' },
  { value: ' ', label: 'Space' },
  { value: '', label: 'None' },
];

/**
 * Available name order options
 */
export const NAME_ORDER_OPTIONS: { value: NameOrderType; label: string }[] = [
  { value: 'date-name', label: 'Date first (YYMMDD_name)' },
  { value: 'name-date', label: 'Name first (name_YYMMDD)' },
];
