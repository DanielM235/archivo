import { describe, it, expect } from 'vitest';
import { ContractCsvExporter } from './ContractCsvExporter';
import type { IContractData } from '../interfaces/IContractData';

describe('ContractCsvExporter', () => {
  const sampleContract: IContractData = {
    sourceFileName: 'contract_2024.pdf',
    contractDate: '23/01/2024',
    contractNumber: '335584002',
    foreignCurrencyValue: '25.000,00',
    foreignCurrency: 'EUR',
    exchangeRate: '5,3423',
    localCurrencyValue: '133.557,50',
    settlementDeadline: '25/01/2024',
    payerReceiverAbroad: 'EUROPEAN SUPPLIER LTD',
    vesselName: 'ATLANTIC VOYAGER',
  };

  const contractWithErrors: IContractData = {
    ...sampleContract,
    sourceFileName: 'partial_contract.pdf',
    vesselName: '',
    extractionErrors: ['Could not extract vessel name'],
  };

  describe('toCSV', () => {
    it('should generate CSV with headers by default', () => {
      const csv = ContractCsvExporter.toCSV([sampleContract]);

      expect(csv).toContain('Source File');
      expect(csv).toContain('Contract Date');
      expect(csv).toContain('Contract Number');
    });

    it('should include data rows', () => {
      const csv = ContractCsvExporter.toCSV([sampleContract]);

      expect(csv).toContain('contract_2024.pdf');
      expect(csv).toContain('23/01/2024');
      expect(csv).toContain('335584002');
      expect(csv).toContain('EUR');
      expect(csv).toContain('25.000,00');
    });

    it('should use semicolon as default separator', () => {
      const csv = ContractCsvExporter.toCSV([sampleContract]);
      const lines = csv.split('\n');

      // Header line should have semicolons
      expect(lines[0]).toContain(';');
    });

    it('should support custom separator', () => {
      const csv = ContractCsvExporter.toCSV([sampleContract], { separator: ',' });
      const lines = csv.split('\n');

      expect(lines[0]).toContain(',');
    });

    it('should generate CSV without headers when specified', () => {
      const csv = ContractCsvExporter.toCSV([sampleContract], { includeHeader: false });

      expect(csv).not.toContain('Source File');
      expect(csv).toContain('contract_2024.pdf');
    });

    it('should handle multiple contracts', () => {
      const contracts = [sampleContract, { ...sampleContract, contractNumber: '335584003' }];
      const csv = ContractCsvExporter.toCSV(contracts);
      const lines = csv.split('\n').filter((l) => l.trim());

      // 1 header + 2 data rows
      expect(lines).toHaveLength(3);
    });

    it('should include extraction errors column', () => {
      const csv = ContractCsvExporter.toCSV([contractWithErrors]);

      expect(csv).toContain('Could not extract vessel name');
    });

    it('should use Portuguese headers when specified', () => {
      const csv = ContractCsvExporter.toCSV([sampleContract], {}, true);

      expect(csv).toContain('Arquivo Origem');
      expect(csv).toContain('Data do Contrato');
      expect(csv).toContain('Número do Contrato');
      expect(csv).toContain('Moeda Estrangeira');
      expect(csv).toContain('Nome do Navio');
    });

    it('should escape fields containing separator', () => {
      const contractWithComma: IContractData = {
        ...sampleContract,
        payerReceiverAbroad: 'Company, Inc.',
      };
      const csv = ContractCsvExporter.toCSV([contractWithComma], { separator: ',' });

      expect(csv).toContain('"Company, Inc."');
    });

    it('should escape fields containing quotes', () => {
      const contractWithQuotes: IContractData = {
        ...sampleContract,
        payerReceiverAbroad: 'Company "Test" Ltd',
      };
      const csv = ContractCsvExporter.toCSV([contractWithQuotes]);

      expect(csv).toContain('""Test""');
    });

    it('should include BOM for UTF-8 Excel compatibility', () => {
      const csv = ContractCsvExporter.toCSV([sampleContract]);

      expect(csv.charCodeAt(0)).toBe(0xfeff);
    });
  });

  describe('generateFileName', () => {
    it('should generate filename with timestamp', () => {
      const fileName = ContractCsvExporter.generateFileName();

      expect(fileName).toMatch(/^contracts_\d{8}_\d{6}\.csv$/);
    });

    it('should use custom prefix', () => {
      const fileName = ContractCsvExporter.generateFileName('forex_export');

      expect(fileName).toMatch(/^forex_export_\d{8}_\d{6}\.csv$/);
    });
  });

  describe('empty data', () => {
    it('should handle empty array', () => {
      const csv = ContractCsvExporter.toCSV([]);
      const lines = csv.split('\n').filter((l) => l.trim());

      // Only header
      expect(lines).toHaveLength(1);
    });
  });
});
