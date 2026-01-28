import { describe, it, expect } from 'vitest';
import { ReconciliationExcelExporter } from '../services/ReconciliationExcelExporter';
import type { IReconciliationSummary } from '../interfaces/IDiData';

describe('ReconciliationExcelExporter', () => {
  const exporter = new ReconciliationExcelExporter();

  const createMockSummary = (
    overrides: Partial<IReconciliationSummary> = {}
  ): IReconciliationSummary => ({
    contracts: [
      {
        contractNumber: '12345',
        contractDate: '01/01/2024',
        foreignCurrencyValue: '50.000,00',
        foreignCurrencyType: 'EUR',
        eurValue: '50.000,00',
        sourceFile: 'contract1.pdf',
      },
      {
        contractNumber: '67890',
        contractDate: '02/01/2024',
        foreignCurrencyValue: '30.000,00',
        foreignCurrencyType: 'EUR',
        eurValue: '30.000,00',
        sourceFile: 'contract2.pdf',
      },
    ],
    totalContractsEur: '80.000,00',
    di: {
      vmldValueUsd: '100.000,00',
      usdToBrlRate: '5,0000',
      eurToBrlRate: '5,5000',
      usdToEurRate: '0,9091',
      vmldValueEur: '90.909,09',
    },
    differenceEur: '10.909,09',
    vesselName: 'Test Vessel',
    ...overrides,
  });

  describe('export', () => {
    it('should create a Blob with Excel mime type', () => {
      const summary = createMockSummary();
      const blob = exporter.export(summary);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should create a non-empty blob', () => {
      const summary = createMockSummary();
      const blob = exporter.export(summary);

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle summary without vessel name', () => {
      const summary = createMockSummary({ vesselName: undefined });
      const blob = exporter.export(summary);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should handle summary with no contracts', () => {
      const summary = createMockSummary({ contracts: [], totalContractsEur: '0,00' });
      const blob = exporter.export(summary);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(0);
    });
  });

  describe('generateFileName', () => {
    it('should generate file name with date', () => {
      const fileName = exporter.generateFileName();

      expect(fileName).toMatch(/^reconciliacao_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should include vessel name when provided', () => {
      const fileName = exporter.generateFileName('MY VESSEL');

      expect(fileName).toMatch(/^reconciliacao_my_vessel_\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should sanitize special characters in vessel name', () => {
      const fileName = exporter.generateFileName('Test <Vessel>');

      expect(fileName).not.toContain('<');
      expect(fileName).not.toContain('>');
    });

    it('should replace spaces with underscores', () => {
      const fileName = exporter.generateFileName('Some Vessel Name');

      expect(fileName).toContain('some_vessel_name');
    });

    it('should truncate long vessel names', () => {
      const longName = 'A'.repeat(100);
      const fileName = exporter.generateFileName(longName);

      // 50 chars max + date + extension
      expect(fileName.length).toBeLessThan(100);
    });
  });
});
