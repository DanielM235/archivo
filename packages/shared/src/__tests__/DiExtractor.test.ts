import { describe, it, expect } from 'vitest';
import { DiExtractor } from '../services/DiExtractor';

describe('DiExtractor', () => {
  const extractor = new DiExtractor();

  describe('canExtract', () => {
    it('should return true for valid DI document', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 409.635,02
        US$ : 5,4000;
        EURO: 5,7931;
      `;
      expect(extractor.canExtract(text)).toBe(true);
    });

    it('should return false for non-DI document', () => {
      const text = 'This is a random document without DI markers';
      expect(extractor.canExtract(text)).toBe(false);
    });

    it('should return true with alternate spelling variations', () => {
      const text = `
        Declaracao de Importacao
        TAXAS DE CAMBIO
        VMLD: 100.000,00
      `;
      expect(extractor.canExtract(text)).toBe(true);
    });
  });

  describe('extract', () => {
    it('should extract VMLD value in USD', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 409.635,02
        US$ : 5,4000;
        EURO: 5,7931;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      expect(result.vmldValueUsd).toBe('409.635,02');
    });

    it('should extract USD to BRL rate', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 409.635,02
        US$ : 5,4000;
        EURO: 5,7931;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      expect(result.usdToBrlRate).toBe('5,4000');
    });

    it('should extract EUR to BRL rate', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 409.635,02
        US$ : 5,4000;
        EURO: 5,7931;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      expect(result.eurToBrlRate).toBe('5,7931');
    });

    it('should calculate USD to EUR rate correctly', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 409.635,02
        US$ : 5,4000;
        EURO: 5,7931;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      // USD/EUR = USD/BRL / EUR/BRL = 5.4 / 5.7931 ≈ 0.9321
      expect(result.usdToEurRate).toBe('0,9321');
    });

    it('should calculate VMLD value in EUR correctly', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 409.635,02
        US$ : 5,4000;
        EURO: 5,7931;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      // VMLD EUR = 409635.02 * (5.4 / 5.7931) ≈ 381820.80
      const vmldEur = parseFloat(result.vmldValueEur.replace(/\./g, '').replace(',', '.'));
      expect(vmldEur).toBeCloseTo(381820.8, 0);
    });

    it('should include source file name', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 100.000,00
        US$ : 5,0000;
        EURO: 6,0000;
      `;
      const result = extractor.extract(text, 'my-di-file.pdf');

      expect(result.sourceFileName).toBe('my-di-file.pdf');
    });

    it('should handle missing VMLD value with error', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        US$ : 5,4000;
        EURO: 5,7931;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      expect(result.vmldValueUsd).toBe('');
      expect(result.extractionErrors).toContain('Could not extract VMLD value');
    });

    it('should handle missing USD rate with error', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 100.000,00
        EURO: 5,7931;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      expect(result.usdToBrlRate).toBe('');
      expect(result.extractionErrors).toContain('Could not extract USD to BRL rate');
    });

    it('should handle missing EUR rate with error', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: DOLAR DOS ESTADOS UNIDOS 100.000,00
        US$ : 5,4000;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      expect(result.eurToBrlRate).toBe('');
      expect(result.extractionErrors).toContain('Could not extract EUR to BRL rate');
    });

    it('should handle alternate VMLD format', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: 250.000,50
        US$ : 5,0000;
        EURO: 5,5000;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      expect(result.vmldValueUsd).toBe('250.000,50');
    });

    it('should handle USD format variations', () => {
      const text = `
        Declaração de Importação
        TAXAS DE CÂMBIO
        VMLD: USD 100.000,00
        USD: 5,0000;
        EUR: 5,5000;
      `;
      const result = extractor.extract(text, 'test-di.pdf');

      expect(result.usdToBrlRate).toBe('5,0000');
      expect(result.eurToBrlRate).toBe('5,5000');
    });
  });
});
