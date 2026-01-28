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
    // Map contracts to reconciliation format with EUR values
    const reconciliationContracts = contracts.map((contract) =>
      this.mapContractToReconciliation(contract, di.usdToEurRate)
    );

    // Calculate total EUR from contracts
    const totalContractsEur = this.calculateTotal(reconciliationContracts);

    // Calculate difference
    const diEur = this.parseNumber(di.vmldValueEur);
    const difference = diEur - totalContractsEur;
    const differenceEur = this.formatBrazilianNumber(difference);

    return {
      contracts: reconciliationContracts,
      totalContractsEur: this.formatBrazilianNumber(totalContractsEur),
      di: {
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
    usdToEurRate: string
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

    return {
      contractNumber: contract.contractNumber,
      contractDate: contract.contractDate,
      foreignCurrencyValue: contract.foreignCurrencyValue,
      foreignCurrencyType: currency,
      eurValue: this.formatBrazilianNumber(eurValue),
      sourceFile: contract.sourceFileName || '',
    };
  }

  /**
   * Calculate total from reconciliation contracts
   */
  private calculateTotal(contracts: IReconciliationContract[]): number {
    return contracts.reduce((total, contract) => {
      return total + this.parseNumber(contract.eurValue);
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
