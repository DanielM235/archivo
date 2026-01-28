import { describe, it, expect } from 'vitest';
import { ReconciliationService } from '../services/ReconciliationService';
import type { IContractData } from '../interfaces/IContractData';
import type { IDiData } from '../interfaces/IDiData';

describe('ReconciliationService', () => {
  const service = new ReconciliationService();

  const createMockContract = (overrides: Partial<IContractData> = {}): IContractData => ({
    sourceFileName: 'contract.pdf',
    contractDate: '01/01/2024',
    contractNumber: '12345',
    foreignCurrencyValue: '10.000,00',
    foreignCurrency: 'EUR',
    exchangeRate: '5,5000',
    localCurrencyValue: '55.000,00',
    settlementDeadline: '05/01/2024',
    payerReceiverAbroad: 'Test Company',
    vesselName: 'Test Vessel',
    ...overrides,
  });

  const createMockDiData = (overrides: Partial<IDiData> = {}): IDiData => ({
    sourceFileName: 'di.pdf',
    vmldValueUsd: '100.000,00',
    usdToBrlRate: '5,0000',
    eurToBrlRate: '5,5000',
    usdToEurRate: '0,9091',
    vmldValueEur: '90.909,09',
    ...overrides,
  });

  describe('createSummary', () => {
    it('should create summary with single EUR contract', () => {
      const contracts = [createMockContract({ foreignCurrencyValue: '50.000,00' })];
      const di = createMockDiData();

      const summary = service.createSummary(contracts, di);

      expect(summary.contracts).toHaveLength(1);
      expect(summary.contracts[0].eurValue).toBe('50.000,00');
      expect(summary.totalContractsEur).toBe('50.000,00');
    });

    it('should sum multiple EUR contracts', () => {
      const contracts = [
        createMockContract({ foreignCurrencyValue: '30.000,00', contractNumber: '001' }),
        createMockContract({ foreignCurrencyValue: '20.000,00', contractNumber: '002' }),
      ];
      const di = createMockDiData();

      const summary = service.createSummary(contracts, di);

      expect(summary.contracts).toHaveLength(2);
      expect(summary.totalContractsEur).toBe('50.000,00');
    });

    it('should convert USD contracts to EUR', () => {
      const contracts = [
        createMockContract({
          foreignCurrencyValue: '100.000,00',
          foreignCurrency: 'USD',
        }),
      ];
      const di = createMockDiData({ usdToEurRate: '0,9000' });

      const summary = service.createSummary(contracts, di);

      // 100000 * 0.9 = 90000
      expect(summary.contracts[0].eurValue).toBe('90.000,00');
    });

    it('should calculate difference between DI and contracts', () => {
      const contracts = [createMockContract({ foreignCurrencyValue: '90.000,00' })];
      const di = createMockDiData({ vmldValueEur: '100.000,00' });

      const summary = service.createSummary(contracts, di);

      // 100000 - 90000 = 10000
      expect(summary.differenceEur).toBe('10.000,00');
    });

    it('should handle negative difference', () => {
      const contracts = [createMockContract({ foreignCurrencyValue: '120.000,00' })];
      const di = createMockDiData({ vmldValueEur: '100.000,00' });

      const summary = service.createSummary(contracts, di);

      // 100000 - 120000 = -20000
      expect(summary.differenceEur).toBe('-20.000,00');
    });

    it('should include DI data in summary', () => {
      const contracts = [createMockContract()];
      const di = createMockDiData({
        vmldValueUsd: '50.000,00',
        usdToBrlRate: '5,0000',
        eurToBrlRate: '5,5000',
        usdToEurRate: '0,9091',
        vmldValueEur: '45.455,00',
      });

      const summary = service.createSummary(contracts, di);

      expect(summary.di.vmldValueUsd).toBe('50.000,00');
      expect(summary.di.usdToBrlRate).toBe('5,0000');
      expect(summary.di.eurToBrlRate).toBe('5,5000');
      expect(summary.di.usdToEurRate).toBe('0,9091');
      expect(summary.di.vmldValueEur).toBe('45.455,00');
    });

    it('should include vessel name when provided', () => {
      const contracts = [createMockContract()];
      const di = createMockDiData();

      const summary = service.createSummary(contracts, di, 'MY VESSEL');

      expect(summary.vesselName).toBe('MY VESSEL');
    });

    it('should include contract details in summary', () => {
      const contracts = [
        createMockContract({
          contractNumber: 'ABC123',
          contractDate: '15/06/2024',
          foreignCurrencyValue: '25.000,00',
          foreignCurrency: 'EUR',
          sourceFileName: 'contract-abc.pdf',
        }),
      ];
      const di = createMockDiData();

      const summary = service.createSummary(contracts, di);

      expect(summary.contracts[0].contractNumber).toBe('ABC123');
      expect(summary.contracts[0].contractDate).toBe('15/06/2024');
      expect(summary.contracts[0].foreignCurrencyValue).toBe('25.000,00');
      expect(summary.contracts[0].foreignCurrencyType).toBe('EUR');
      expect(summary.contracts[0].sourceFile).toBe('contract-abc.pdf');
    });

    it('should handle unknown currency types (not EUR or USD)', () => {
      const contracts = [
        createMockContract({
          foreignCurrencyValue: '50.000,00',
          foreignCurrency: 'GBP',
        }),
      ];
      const di = createMockDiData();

      const summary = service.createSummary(contracts, di);

      // Unknown currency should use value as-is
      expect(summary.contracts[0].eurValue).toBe('50.000,00');
      expect(summary.contracts[0].foreignCurrencyType).toBe('GBP');
    });

    it('should handle missing foreignCurrency field', () => {
      const contracts = [
        createMockContract({
          foreignCurrencyValue: '30.000,00',
          foreignCurrency: undefined,
        }),
      ];
      const di = createMockDiData();

      const summary = service.createSummary(contracts, di);

      // Should default to 'EUR'
      expect(summary.contracts[0].foreignCurrencyType).toBe('EUR');
      expect(summary.contracts[0].eurValue).toBe('30.000,00');
    });

    it('should handle empty foreignCurrencyValue', () => {
      const contracts = [
        createMockContract({
          foreignCurrencyValue: '',
        }),
      ];
      const di = createMockDiData();

      const summary = service.createSummary(contracts, di);

      expect(summary.contracts[0].eurValue).toBe('0,00');
      expect(summary.totalContractsEur).toBe('0,00');
    });

    it('should handle empty sourceFileName', () => {
      const contracts = [
        createMockContract({
          sourceFileName: undefined,
        }),
      ];
      const di = createMockDiData();

      const summary = service.createSummary(contracts, di);

      expect(summary.contracts[0].sourceFile).toBe('');
    });

    it('should handle empty vmldValueEur in DI', () => {
      const contracts = [createMockContract({ foreignCurrencyValue: '50.000,00' })];
      const di = createMockDiData({ vmldValueEur: '' });

      const summary = service.createSummary(contracts, di);

      // 0 - 50000 = -50000
      expect(summary.differenceEur).toBe('-50.000,00');
    });

    it('should handle case-insensitive currency codes', () => {
      const contracts = [
        createMockContract({
          foreignCurrencyValue: '100.000,00',
          foreignCurrency: 'usd',
        }),
      ];
      const di = createMockDiData({ usdToEurRate: '0,9000' });

      const summary = service.createSummary(contracts, di);

      expect(summary.contracts[0].eurValue).toBe('90.000,00');
    });

    it('should handle mixed EUR and USD contracts', () => {
      const contracts = [
        createMockContract({
          foreignCurrencyValue: '50.000,00',
          foreignCurrency: 'EUR',
          contractNumber: '001',
        }),
        createMockContract({
          foreignCurrencyValue: '50.000,00',
          foreignCurrency: 'USD',
          contractNumber: '002',
        }),
      ];
      const di = createMockDiData({ usdToEurRate: '0,8000' });

      const summary = service.createSummary(contracts, di);

      // EUR: 50000 + USD: 50000 * 0.8 = 50000 + 40000 = 90000
      expect(summary.totalContractsEur).toBe('90.000,00');
    });
  });
});
