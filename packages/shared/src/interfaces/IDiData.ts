/**
 * Represents the structured data extracted from a DI (Declaração de Importação) document
 */
export interface IDiData {
  /**
   * Source file name
   */
  sourceFileName: string;

  /**
   * VMLD value in USD (Valor da Mercadoria no Local de Descarga)
   * Format: "409.635,02"
   */
  vmldValueUsd: string;

  /**
   * USD to BRL exchange rate
   * Format: "5,4000"
   */
  usdToBrlRate: string;

  /**
   * EUR to BRL exchange rate
   * Format: "5,7931"
   */
  eurToBrlRate: string;

  /**
   * Calculated USD to EUR rate (usdToBrlRate / eurToBrlRate)
   */
  usdToEurRate: string;

  /**
   * VMLD value converted to EUR
   */
  vmldValueEur: string;

  /**
   * Any errors encountered during extraction
   */
  extractionErrors?: string[];
}

/**
 * Result of DI extraction
 */
export interface IDiExtractionResult {
  /**
   * Whether extraction was successful
   */
  success: boolean;

  /**
   * Extracted data (if successful)
   */
  data?: IDiData;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Source file
   */
  sourceFile: File;
}

/**
 * Contract data mapped for reconciliation
 */
export interface IReconciliationContract {
  /**
   * Contract number
   */
  contractNumber: string;

  /**
   * Contract date
   */
  contractDate: string;

  /**
   * Original foreign currency value
   */
  foreignCurrencyValue: string;

  /**
   * Original foreign currency type (EUR, USD)
   */
  foreignCurrencyType: string;

  /**
   * Value converted to EUR (formatted as Brazilian number)
   */
  eurValue: string;

  /**
   * Source file name
   */
  sourceFile: string;
}

/**
 * Summary data for the reconciliation report
 */
export interface IReconciliationSummary {
  /**
   * Individual contract values in EUR
   */
  contracts: IReconciliationContract[];

  /**
   * Total sum of all contracts in EUR (formatted as Brazilian number)
   */
  totalContractsEur: string;

  /**
   * DI data summary
   */
  di: {
    vmldValueUsd: string;
    usdToBrlRate: string;
    eurToBrlRate: string;
    usdToEurRate: string;
    vmldValueEur: string;
  };

  /**
   * Difference between DI EUR and sum of contracts EUR
   * Positive means DI is greater, negative means contracts sum is greater
   * Formatted as Brazilian number
   */
  differenceEur: string;

  /**
   * Vessel name (user-provided)
   */
  vesselName?: string;
}
