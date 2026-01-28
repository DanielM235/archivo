import type { IContractData } from '../interfaces/IContractData';
import type {
  IDiData,
  IReconciliationSummary,
  IReconciliationContract,
} from '../interfaces/IDiData';

/**
 * Service to create reconciliation summary between contracts and DI data
 */
export class ReconciliationService {
  /**
   * Create a reconciliation summary from contracts and DI data
   */
  createSummary(
    contracts: IContractData[],
    di: IDiData,
    vesselName?: string
  ): IReconciliationSummary {
    // Calculate EUR to USD rate (inverse of USD to EUR)
    const usdToEurRateNum = this.parseNumber(di.usdToEurRate);
    const eurToUsdRateNum = usdToEurRateNum > 0 ? 1 / usdToEurRateNum : 0;
    const eurToUsdRate = eurToUsdRateNum.toFixed(4).replace('.', ',');

    // Map contracts to reconciliation format with EUR, BRL, and USD values
    const reconciliationContracts = contracts.map((contract) =>
      this.mapContractToReconciliation(
        contract,
        di.usdToEurRate,
        eurToUsdRateNum,
        di.diNumber,
        di.diDate
      )
    );

    // Calculate totals
    const totalContractsEur = this.calculateTotalEur(reconciliationContracts);
    const totalContractsBrl = this.calculateTotalBrl(reconciliationContracts);
    const totalContractsUsd = this.calculateTotalUsd(reconciliationContracts);

    // Calculate difference
    const diEur = this.parseNumber(di.vmldValueEur);
    const difference = diEur - totalContractsEur;
    const differenceEur = this.formatBrazilianNumber(difference);

    return {
      contracts: reconciliationContracts,
      totalContractsEur: this.formatBrazilianNumber(totalContractsEur),
      totalContractsBrl: this.formatBrazilianNumber(totalContractsBrl),
      totalContractsUsd: this.formatBrazilianNumber(totalContractsUsd),
      eurToUsdRate,
      di: {
        diNumber: di.diNumber,
        diDate: di.diDate,
        vmldValueUsd: di.vmldValueUsd,
        usdToBrlRate: di.usdToBrlRate,
        eurToBrlRate: di.eurToBrlRate,
        usdToEurRate: di.usdToEurRate,
        vmldValueEur: di.vmldValueEur,
      },
      differenceEur,
      vesselName,
    };
  }

  /**
   * Map a contract to reconciliation format
   */
  private mapContractToReconciliation(
    contract: IContractData,
    usdToEurRate: string,
    eurToUsdRate: number,
    diNumber: string,
    diDate: string
  ): IReconciliationContract {
    // Get the foreign currency value
    const foreignValue = this.parseNumber(contract.foreignCurrencyValue);
    const currency = contract.foreignCurrency || 'EUR';

    // Calculate EUR value based on currency
    let eurValue: number;
    if (currency.toUpperCase() === 'EUR') {
      eurValue = foreignValue;
    } else if (currency.toUpperCase() === 'USD') {
      // Convert USD to EUR using the rate from DI
      const rate = this.parseNumber(usdToEurRate);
      eurValue = foreignValue * rate;
    } else {
      // Unknown currency, use as-is
      eurValue = foreignValue;
    }

    // Get BRL value from contract
    const brlValue = this.parseNumber(contract.localCurrencyValue);

    // Calculate USD value from EUR using the EUR to USD rate
    const usdValue = eurValue * eurToUsdRate;

    return {
      contractNumber: contract.contractNumber,
      contractDate: contract.contractDate,
      diNumber,
      diDate,
      foreignCurrencyValue: contract.foreignCurrencyValue,
      foreignCurrencyType: currency,
      eurValue: this.formatBrazilianNumber(eurValue),
      brlValue: this.formatBrazilianNumber(brlValue),
      exchangeRate: contract.exchangeRate,
      usdValue: this.formatBrazilianNumber(usdValue),
      sourceFile: contract.sourceFileName || '',
    };
  }

  /**
   * Calculate total EUR from reconciliation contracts
   */
  private calculateTotalEur(contracts: IReconciliationContract[]): number {
    return contracts.reduce((total, contract) => {
      return total + this.parseNumber(contract.eurValue);
    }, 0);
  }

  /**
   * Calculate total BRL from reconciliation contracts
   */
  private calculateTotalBrl(contracts: IReconciliationContract[]): number {
    return contracts.reduce((total, contract) => {
      return total + this.parseNumber(contract.brlValue);
    }, 0);
  }

  /**
   * Calculate total USD from reconciliation contracts
   */
  private calculateTotalUsd(contracts: IReconciliationContract[]): number {
    return contracts.reduce((total, contract) => {
      return total + this.parseNumber(contract.usdValue);
    }, 0);
  }

  /**
   * Parse a Brazilian formatted number string to a number
   */
  private parseNumber(value: string): number {
    if (!value) return 0;
    const normalized = value.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }

  /**
   * Format a number to Brazilian format
   */
  private formatBrazilianNumber(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
