import type { IContractData, ICsvExportOptions } from '../interfaces/IContractData';

/**
 * CSV column configuration for contract export
 */
interface ICsvColumn {
  /** Column header */
  header: string;
  /** Function to extract value from contract data */
  getValue: (data: IContractData) => string;
}

/**
 * Default CSV columns configuration
 * Source file is placed at the end for better readability
 */
const DEFAULT_COLUMNS: ICsvColumn[] = [
  { header: 'Contract Date', getValue: (d) => d.contractDate },
  { header: 'Contract Number', getValue: (d) => d.contractNumber },
  { header: 'Foreign Currency', getValue: (d) => d.foreignCurrency },
  { header: 'Foreign Currency Value', getValue: (d) => d.foreignCurrencyValue },
  { header: 'Exchange Rate', getValue: (d) => d.exchangeRate },
  { header: 'Local Currency Value (BRL)', getValue: (d) => d.localCurrencyValue },
  { header: 'Settlement Deadline', getValue: (d) => d.settlementDeadline },
  { header: 'Payer/Receiver Abroad', getValue: (d) => d.payerReceiverAbroad },
  { header: 'Vessel Name', getValue: (d) => d.vesselName },
  { header: 'Source File', getValue: (d) => d.sourceFileName },
  { header: 'Extraction Errors', getValue: (d) => d.extractionErrors?.join('; ') || '' },
];

/**
 * Portuguese CSV columns configuration
 * Arquivo origem is placed at the end for better readability
 */
const PORTUGUESE_COLUMNS: ICsvColumn[] = [
  { header: 'Data do Contrato', getValue: (d) => d.contractDate },
  { header: 'Número do Contrato', getValue: (d) => d.contractNumber },
  { header: 'Moeda Estrangeira', getValue: (d) => d.foreignCurrency },
  { header: 'Valor Moeda Estrangeira', getValue: (d) => d.foreignCurrencyValue },
  { header: 'Taxa de Câmbio', getValue: (d) => d.exchangeRate },
  { header: 'Valor em Reais (BRL)', getValue: (d) => d.localCurrencyValue },
  { header: 'Prazo de Liquidação', getValue: (d) => d.settlementDeadline },
  { header: 'Pagador/Recebedor Exterior', getValue: (d) => d.payerReceiverAbroad },
  { header: 'Nome do Navio', getValue: (d) => d.vesselName },
  { header: 'Arquivo Origem', getValue: (d) => d.sourceFileName },
  { header: 'Erros de Extração', getValue: (d) => d.extractionErrors?.join('; ') || '' },
];

/**
 * Utility class for exporting contract data to CSV format
 */
export class ContractCsvExporter {
  /**
   * Convert contract data array to CSV string
   * @param contracts - Array of contract data
   * @param options - Export options
   * @param usePortugueseHeaders - Use Portuguese column headers
   * @returns CSV formatted string
   */
  static toCSV(
    contracts: IContractData[],
    options: ICsvExportOptions = {},
    usePortugueseHeaders: boolean = false
  ): string {
    const { separator = ';', includeHeader = true, decimalSeparator = ',' } = options;

    const columns = usePortugueseHeaders ? PORTUGUESE_COLUMNS : DEFAULT_COLUMNS;
    const lines: string[] = [];

    // Add header row
    if (includeHeader) {
      const headers = columns.map((col) => this.escapeCSVField(col.header, separator));
      lines.push(headers.join(separator));
    }

    // Add data rows
    for (const contract of contracts) {
      const values = columns.map((col) => {
        let value = col.getValue(contract);

        // Apply decimal separator transformation if needed
        if (decimalSeparator !== ',' && this.isNumeric(value)) {
          value = value.replace(',', decimalSeparator);
        }

        return this.escapeCSVField(value, separator);
      });
      lines.push(values.join(separator));
    }

    // Add BOM for Excel compatibility with UTF-8
    return '\uFEFF' + lines.join('\n');
  }

  /**
   * Download CSV content as a file
   * @param csvContent - CSV string content
   * @param fileName - Output file name
   */
  static downloadCSV(csvContent: string, fileName: string = 'contracts_export.csv'): void {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export contracts directly to a downloadable CSV file
   * @param contracts - Array of contract data
   * @param fileName - Output file name
   * @param options - Export options
   * @param usePortugueseHeaders - Use Portuguese headers
   */
  static exportToFile(
    contracts: IContractData[],
    fileName: string = 'contracts_export.csv',
    options: ICsvExportOptions = {},
    usePortugueseHeaders: boolean = false
  ): void {
    const csvContent = this.toCSV(contracts, options, usePortugueseHeaders);
    this.downloadCSV(csvContent, fileName);
  }

  /**
   * Generate a filename with timestamp
   * @param prefix - Filename prefix
   * @returns Filename with timestamp
   */
  static generateFileName(prefix: string = 'contracts'): string {
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '_');
    return `${prefix}_${timestamp}.csv`;
  }

  /**
   * Escape a field value for CSV format
   */
  private static escapeCSVField(value: string, separator: string): string {
    if (!value) return '';

    // Check if value needs quoting
    const needsQuoting =
      value.includes(separator) ||
      value.includes('"') ||
      value.includes('\n') ||
      value.includes('\r');

    if (needsQuoting) {
      // Escape double quotes by doubling them
      const escaped = value.replace(/"/g, '""');
      return `"${escaped}"`;
    }

    return value;
  }

  /**
   * Check if a string looks like a numeric value
   */
  private static isNumeric(value: string): boolean {
    return /^[\d.,]+$/.test(value);
  }
}
