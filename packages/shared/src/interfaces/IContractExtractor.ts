import type { IContractData } from './IContractData';

/**
 * Interface for contract extractors
 * Allows different implementations for different PDF formats
 */
export interface IContractExtractor {
  /**
   * Unique identifier for this extractor
   */
  readonly id: string;

  /**
   * Human-readable name for this extractor
   */
  readonly name: string;

  /**
   * Description of the PDF format this extractor handles
   */
  readonly description: string;

  /**
   * Check if this extractor can handle the given PDF text content
   * @param text - Raw text extracted from PDF
   * @returns True if this extractor can parse this content
   */
  canExtract(text: string): boolean;

  /**
   * Extract contract data from PDF text content
   * @param text - Raw text extracted from PDF
   * @param fileName - Original file name for reference
   * @returns Extracted contract data
   */
  extract(text: string, fileName: string): IContractData;
}

/**
 * PDF text extraction adapter interface
 * Allows different implementations for web and electron
 */
export interface IPdfTextAdapter {
  /**
   * Extract text content from a PDF file
   * @param file - File object or file path
   * @returns Promise resolving to the extracted text
   */
  extractText(file: File | ArrayBuffer): Promise<string>;
}

/**
 * Registry for contract extractors
 */
export interface IContractExtractorRegistry {
  /**
   * Register a new extractor
   * @param extractor - Extractor instance to register
   */
  register(extractor: IContractExtractor): void;

  /**
   * Get all registered extractors
   * @returns Array of registered extractors
   */
  getAll(): IContractExtractor[];

  /**
   * Find an extractor that can handle the given text content
   * @param text - Raw text from PDF
   * @returns Matching extractor or null if none found
   */
  findExtractor(text: string): IContractExtractor | null;

  /**
   * Get extractor by ID
   * @param id - Extractor ID
   * @returns Extractor or null if not found
   */
  getById(id: string): IContractExtractor | null;
}
