/**
 * Represents a file to be merged with its sheet configuration
 */
export interface IExcelMergeFile {
  /**
   * The source file
   */
  file: File;

  /**
   * Name of the sheet to merge (if specified)
   * If not specified, will use the first sheet
   */
  sheetName?: string;

  /**
   * Status of processing this file
   */
  status: 'pending' | 'processing' | 'completed' | 'error';

  /**
   * Error message if processing failed
   */
  error?: string;

  /**
   * Number of rows extracted from this file
   */
  rowCount?: number;
}

/**
 * Result of merging Excel files
 */
export interface IExcelMergeResult {
  /**
   * Whether the merge was successful
   */
  success: boolean;

  /**
   * The merged Excel file as a Blob
   */
  blob?: Blob;

  /**
   * Total number of files processed
   */
  totalFiles: number;

  /**
   * Number of successfully processed files
   */
  successCount: number;

  /**
   * Number of failed files
   */
  errorCount: number;

  /**
   * Total rows merged (excluding header)
   */
  totalRows: number;

  /**
   * Individual file results
   */
  fileResults: IExcelMergeFile[];

  /**
   * Error message if merge failed
   */
  error?: string;
}

/**
 * Configuration for Excel merge operation
 */
export interface IExcelMergeConfig {
  /**
   * Name of the sheet to extract from each file
   * If not specified, will use the first sheet
   */
  targetSheetName?: string;

  /**
   * Name for the output sheet in the merged file
   */
  outputSheetName: string;

  /**
   * Whether to include margins (empty row and column at start)
   * Default: true
   */
  includeMargins?: boolean;

  /**
   * Indices of columns to include in the output (0-based)
   * If not specified, all columns will be included
   */
  selectedColumnIndices?: number[];
}

/**
 * Result of extracting headers from files
 */
export interface IHeaderExtractionResult {
  /**
   * Whether extraction was successful
   */
  success: boolean;

  /**
   * Extracted headers
   */
  headers?: string[];

  /**
   * Error message if extraction failed
   */
  error?: string;
}
