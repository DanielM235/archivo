import type {
  IContractExtractor,
  IContractExtractorRegistry,
} from '../interfaces/IContractExtractor';

/**
 * Registry for managing contract extractors
 * Allows dynamic registration of extractors for different PDF formats
 */
export class ContractExtractorRegistry implements IContractExtractorRegistry {
  private extractors: Map<string, IContractExtractor> = new Map();

  /**
   * Register a new extractor
   * @param extractor - Extractor instance to register
   */
  register(extractor: IContractExtractor): void {
    if (this.extractors.has(extractor.id)) {
      console.warn(`Extractor with id "${extractor.id}" is already registered. Overwriting.`);
    }
    this.extractors.set(extractor.id, extractor);
  }

  /**
   * Get all registered extractors
   * @returns Array of registered extractors
   */
  getAll(): IContractExtractor[] {
    return Array.from(this.extractors.values());
  }

  /**
   * Find an extractor that can handle the given text content
   * @param text - Raw text from PDF
   * @returns Matching extractor or null if none found
   */
  findExtractor(text: string): IContractExtractor | null {
    for (const extractor of this.extractors.values()) {
      if (extractor.canExtract(text)) {
        return extractor;
      }
    }
    return null;
  }

  /**
   * Get extractor by ID
   * @param id - Extractor ID
   * @returns Extractor or null if not found
   */
  getById(id: string): IContractExtractor | null {
    return this.extractors.get(id) ?? null;
  }

  /**
   * Remove an extractor by ID
   * @param id - Extractor ID to remove
   * @returns True if extractor was removed
   */
  unregister(id: string): boolean {
    return this.extractors.delete(id);
  }

  /**
   * Clear all registered extractors
   */
  clear(): void {
    this.extractors.clear();
  }
}

/**
 * Default singleton instance of the extractor registry
 */
export const contractExtractorRegistry = new ContractExtractorRegistry();
