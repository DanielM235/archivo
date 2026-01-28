import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ContractExtractorRegistry } from './ContractExtractorRegistry';
import { BtgPactualContractExtractor } from './BtgPactualContractExtractor';
import type { IContractExtractor } from '../interfaces/IContractExtractor';
import type { IContractData } from '../interfaces/IContractData';

/**
 * Mock extractor for testing
 */
class MockExtractor implements IContractExtractor {
  readonly id = 'mock-extractor';
  readonly name = 'Mock Extractor';
  readonly description = 'A mock extractor for testing';

  constructor(private shouldMatch: boolean = false) {}

  canExtract(text: string): boolean {
    return this.shouldMatch || text.includes('MOCK_MARKER');
  }

  extract(text: string, fileName: string): IContractData {
    return {
      sourceFileName: fileName,
      contractDate: '01/01/2024',
      contractNumber: 'MOCK-001',
      foreignCurrencyValue: '1000.00',
      foreignCurrency: 'USD',
      exchangeRate: '5.00',
      localCurrencyValue: '5000.00',
      settlementDeadline: '02/01/2024',
      payerReceiverAbroad: 'Mock Company',
      vesselName: 'MOCK VESSEL',
    };
  }
}

describe('ContractExtractorRegistry', () => {
  let registry: ContractExtractorRegistry;

  beforeEach(() => {
    registry = new ContractExtractorRegistry();
  });

  describe('register', () => {
    it('should register an extractor', () => {
      const extractor = new MockExtractor();
      registry.register(extractor);

      expect(registry.getAll()).toHaveLength(1);
      expect(registry.getById('mock-extractor')).toBe(extractor);
    });

    it('should overwrite extractor with same id', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const extractor1 = new MockExtractor();
      const extractor2 = new MockExtractor();

      registry.register(extractor1);
      registry.register(extractor2);

      expect(registry.getAll()).toHaveLength(1);
      expect(registry.getById('mock-extractor')).toBe(extractor2);
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('is already registered'));

      consoleWarnSpy.mockRestore();
    });

    it('should register multiple extractors with different ids', () => {
      const mockExtractor = new MockExtractor();
      const btgExtractor = new BtgPactualContractExtractor();

      registry.register(mockExtractor);
      registry.register(btgExtractor);

      expect(registry.getAll()).toHaveLength(2);
    });
  });

  describe('getAll', () => {
    it('should return empty array when no extractors registered', () => {
      expect(registry.getAll()).toEqual([]);
    });

    it('should return all registered extractors', () => {
      const mockExtractor = new MockExtractor();
      const btgExtractor = new BtgPactualContractExtractor();

      registry.register(mockExtractor);
      registry.register(btgExtractor);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(mockExtractor);
      expect(all).toContain(btgExtractor);
    });
  });

  describe('getById', () => {
    it('should return extractor by id', () => {
      const extractor = new BtgPactualContractExtractor();
      registry.register(extractor);

      expect(registry.getById('btg-pactual-forex')).toBe(extractor);
    });

    it('should return null for non-existent id', () => {
      expect(registry.getById('non-existent')).toBeNull();
    });
  });

  describe('findExtractor', () => {
    it('should find matching extractor', () => {
      const mockExtractor = new MockExtractor();
      registry.register(mockExtractor);

      const text = 'This text contains MOCK_MARKER for testing';
      const found = registry.findExtractor(text);

      expect(found).toBe(mockExtractor);
    });

    it('should return null when no extractor matches', () => {
      const mockExtractor = new MockExtractor();
      registry.register(mockExtractor);

      const text = 'This text has no matching markers';
      const found = registry.findExtractor(text);

      expect(found).toBeNull();
    });

    it('should return first matching extractor', () => {
      const alwaysMatchExtractor = new MockExtractor(true);
      const btgExtractor = new BtgPactualContractExtractor();

      registry.register(alwaysMatchExtractor);
      registry.register(btgExtractor);

      const text = 'Any text';
      const found = registry.findExtractor(text);

      expect(found).toBe(alwaysMatchExtractor);
    });

    it('should find BTG Pactual extractor for BTG contracts', () => {
      const btgExtractor = new BtgPactualContractExtractor();
      registry.register(btgExtractor);

      const text = `
        BTG Pactual
        CONTRATO DE CÂMBIO
        Dados da Operação
      `;
      const found = registry.findExtractor(text);

      expect(found).toBe(btgExtractor);
    });
  });

  describe('unregister', () => {
    it('should remove extractor by id', () => {
      const extractor = new MockExtractor();
      registry.register(extractor);

      expect(registry.unregister('mock-extractor')).toBe(true);
      expect(registry.getAll()).toHaveLength(0);
    });

    it('should return false for non-existent id', () => {
      expect(registry.unregister('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all extractors', () => {
      registry.register(new MockExtractor());
      registry.register(new BtgPactualContractExtractor());

      registry.clear();

      expect(registry.getAll()).toHaveLength(0);
    });
  });
});
