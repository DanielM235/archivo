/**
 * Represents the structured data extracted from a foreign exchange contract
 */
export interface IContractData {
  /**
   * Source file name
   */
  sourceFileName: string;

  /**
   * Contract date (data do contrato)
   */
  contractDate: string;

  /**
   * Contract number (número do contrato)
   */
  contractNumber: string;

  /**
   * Value in foreign currency (valor em moeda estrangeira)
   */
  foreignCurrencyValue: string;

  /**
   * Foreign currency code (e.g., USD, EUR)
   */
  foreignCurrency: string;

  /**
   * Exchange rate (taxa de câmbio)
   */
  exchangeRate: string;

  /**
   * Value in local currency - BRL (valor em moeda nacional)
   */
  localCurrencyValue: string;

  /**
   * Settlement deadline (liquidação até)
   */
  settlementDeadline: string;

  /**
   * Payer or receiver abroad (pagador/recebedor no exterior)
   */
  payerReceiverAbroad: string;

  /**
   * Vessel name extracted from "Outras especificações" field
   */
  vesselName: string;

  /**
   * Any errors encountered during extraction
   */
  extractionErrors?: string[];
}

/**
 * Result of a contract extraction operation
 */
export interface IContractExtractionResult {
  /**
   * Whether the extraction was successful
   */
  success: boolean;

  /**
   * Extracted contract data (null if extraction failed)
   */
  data: IContractData | null;

  /**
   * Error message if extraction failed
   */
  error?: string;

  /**
   * Source file information
   */
  sourceFile: {
    name: string;
    size: number;
  };
}

/**
 * Batch extraction result for multiple files
 */
export interface IBatchExtractionResult {
  /**
   * Total number of files processed
   */
  totalFiles: number;

  /**
   * Number of successful extractions
   */
  successCount: number;

  /**
   * Number of failed extractions
   */
  failureCount: number;

  /**
   * Individual extraction results
   */
  results: IContractExtractionResult[];
}

/**
 * CSV export options
 */
export interface ICsvExportOptions {
  /**
   * Column separator (default: ',')
   */
  separator?: string;

  /**
   * Include header row (default: true)
   */
  includeHeader?: boolean;

  /**
   * Date format for export (default: 'DD/MM/YYYY')
   */
  dateFormat?: string;

  /**
   * Decimal separator for numbers (default: ',')
   */
  decimalSeparator?: string;
}
