import type {
  IContractData,
  IContractExtractionResult,
  IBatchExtractionResult,
} from '../interfaces/IContractData';
import type { IContractExtractorRegistry, IPdfTextAdapter } from '../interfaces/IContractExtractor';
import { ContractExtractorRegistry, contractExtractorRegistry } from './ContractExtractorRegistry';
import { BtgPactualContractExtractor } from './BtgPactualContractExtractor';

/**
 * Main service for extracting contract data from PDF files
 * Uses static methods for consistency with other services
 */
export class ContractExtractorService {
  /**
   * Initialize the default extractors
   * Should be called once at application startup
   */
  static initializeDefaultExtractors(
    registry: IContractExtractorRegistry = contractExtractorRegistry
  ): void {
    // Register BTG Pactual extractor
    registry.register(new BtgPactualContractExtractor());

    // Additional extractors can be registered here as they are implemented
    // registry.register(new OtherBankExtractor());
  }

  /**
   * Extract contract data from a single PDF file
   * @param pdfAdapter - PDF text extraction adapter
   * @param file - File to extract from
   * @param registry - Extractor registry (uses default if not provided)
   * @returns Extraction result
   */
  static async extractFromFile(
    pdfAdapter: IPdfTextAdapter,
    file: File,
    registry: IContractExtractorRegistry = contractExtractorRegistry
  ): Promise<IContractExtractionResult> {
    try {
      // Extract text from PDF
      const text = await pdfAdapter.extractText(file);

      if (!text || text.trim().length === 0) {
        return {
          success: false,
          data: null,
          error: 'Could not extract text from PDF',
          sourceFile: { name: file.name, size: file.size },
        };
      }

      // Find appropriate extractor
      const extractor = registry.findExtractor(text);

      if (!extractor) {
        return {
          success: false,
          data: null,
          error: 'No extractor found for this PDF format',
          sourceFile: { name: file.name, size: file.size },
        };
      }

      // Extract data
      const data = extractor.extract(text, file.name);

      return {
        success: true,
        data,
        sourceFile: { name: file.name, size: file.size },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        data: null,
        error: errorMessage,
        sourceFile: { name: file.name, size: file.size },
      };
    }
  }

  /**
   * Extract contract data from multiple PDF files
   * @param pdfAdapter - PDF text extraction adapter
   * @param files - Array of files to extract from
   * @param registry - Extractor registry (uses default if not provided)
   * @param onProgress - Optional progress callback
   * @returns Batch extraction result
   */
  static async extractFromFiles(
    pdfAdapter: IPdfTextAdapter,
    files: File[],
    registry: IContractExtractorRegistry = contractExtractorRegistry,
    onProgress?: (processed: number, total: number) => void
  ): Promise<IBatchExtractionResult> {
    const results: IContractExtractionResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const result = await this.extractFromFile(pdfAdapter, file, registry);

      results.push(result);

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }

      if (onProgress) {
        onProgress(i + 1, files.length);
      }
    }

    return {
      totalFiles: files.length,
      successCount,
      failureCount,
      results,
    };
  }

  /**
   * Extract contract data from raw text (for testing or alternative input)
   * @param text - Raw text content
   * @param fileName - Source file name
   * @param registry - Extractor registry
   * @returns Extracted data or null
   */
  static extractFromText(
    text: string,
    fileName: string,
    registry: IContractExtractorRegistry = contractExtractorRegistry
  ): IContractData | null {
    const extractor = registry.findExtractor(text);
    if (!extractor) {
      return null;
    }
    return extractor.extract(text, fileName);
  }

  /**
   * Create a new extractor registry
   * Useful for isolated testing or custom extractor configurations
   */
  static createRegistry(): ContractExtractorRegistry {
    return new ContractExtractorRegistry();
  }
}
