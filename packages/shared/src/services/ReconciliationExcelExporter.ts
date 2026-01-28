import type { IReconciliationSummary } from '../interfaces/IDiData';
import * as XLSX from 'xlsx';

/**
 * Parse a numeric string (with comma as decimal separator) to a number
 */
function parseNumber(value: string): number {
  if (!value || value === '-') return 0;
  // Remove dots (thousand separators) and replace comma with dot (decimal separator)
  const normalized = value.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Service to export reconciliation data to Excel format
 */
export class ReconciliationExcelExporter {
  /**
   * Export reconciliation summary to Excel file
   */
  export(summary: IReconciliationSummary): Blob {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create summary sheet
    const summarySheet = this.createSummarySheet(summary);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    // Create contracts detail sheet
    const contractsSheet = this.createContractsSheet(summary);
    XLSX.utils.book_append_sheet(workbook, contractsSheet, 'Contratos');

    // Generate Excel buffer
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });

    return new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * Create summary sheet with reconciliation data
   */
  private createSummarySheet(summary: IReconciliationSummary): XLSX.WorkSheet {
    const data: (string | number)[][] = [];

    // Empty row for top margin
    data.push(['']);

    // Title (with empty column for left margin)
    data.push(['', 'RECONCILIAÇÃO DE CÂMBIO']);
    data.push(['']);

    // Vessel name
    if (summary.vesselName) {
      data.push(['', 'Embarcação:', summary.vesselName]);
      data.push(['']);
    }

    // DI Information
    data.push(['', 'DADOS DA DI']);
    data.push(['', 'Nº DI:', summary.di.diNumber]);
    data.push(['', 'Data DI:', summary.di.diDate]);
    data.push(['', 'VMLD (USD):', summary.di.vmldValueUsd]);
    data.push(['', 'Taxa USD/BRL:', summary.di.usdToBrlRate]);
    data.push(['', 'Taxa EUR/BRL:', summary.di.eurToBrlRate]);
    data.push(['', 'Taxa USD/EUR:', summary.di.usdToEurRate]);
    data.push(['', 'VMLD (EUR):', summary.di.vmldValueEur]);
    data.push(['']);

    // Contracts summary
    data.push(['', 'RESUMO DOS CONTRATOS']);
    data.push(['', 'Total Contratos (EUR):', summary.totalContractsEur]);
    data.push(['', 'Total Contratos (REAL):', summary.totalContractsBrl]);
    data.push(['']);

    // Difference
    data.push(['', 'DIFERENÇA']);
    data.push(['', 'DI EUR - Contratos EUR:', summary.differenceEur]);

    return XLSX.utils.aoa_to_sheet(data);
  }

  /**
   * Create contracts detail sheet
   */
  private createContractsSheet(summary: IReconciliationSummary): XLSX.WorkSheet {
    const data: (string | number)[][] = [];

    // Empty row for top margin
    data.push(['']);

    // Headers (with empty column for left margin)
    const headerRow = [
      '',
      'Nº Contrato',
      'Data Contrato',
      'Nº DI',
      'Data DI',
      'Valor EUR',
      'Taxa Câmbio',
      'Valor REAL',
      'Nome do Arquivo de Origem',
    ];
    data.push(headerRow);

    // Contract rows - parse numeric values as actual numbers
    for (const contract of summary.contracts) {
      data.push([
        '',
        contract.contractNumber,
        contract.contractDate,
        contract.diNumber,
        contract.diDate,
        parseNumber(contract.eurValue), // Actual number
        parseNumber(contract.exchangeRate), // Actual number
        parseNumber(contract.brlValue), // Actual number
        contract.sourceFile,
      ]);
    }

    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths (including margin column)
    sheet['!cols'] = [
      { wch: 3 }, // Margin column
      { wch: 15 }, // Contract number
      { wch: 14 }, // Contract date
      { wch: 15 }, // DI number
      { wch: 12 }, // DI date
      { wch: 15 }, // EUR value
      { wch: 14 }, // Exchange rate
      { wch: 15 }, // BRL value
      { wch: 40 }, // Source file
    ];

    // Apply number formatting to numeric columns (F, G, H) starting from row 3
    // Note: xlsx community edition has limited styling support
    // For full styling support, consider using xlsx-style or ExcelJS
    const numericCols = ['F', 'G', 'H'];
    const rowCount = summary.contracts.length + 2; // +1 for margin, +1 for header

    for (let rowIdx = 3; rowIdx <= rowCount; rowIdx++) {
      for (const col of numericCols) {
        const cellRef = `${col}${rowIdx}`;
        if (sheet[cellRef]) {
          // Set number format for proper display
          if (col === 'G') {
            // Exchange rate - more decimal places
            sheet[cellRef].z = '#,##0.000000';
          } else {
            // EUR and BRL values - 2 decimal places
            sheet[cellRef].z = '#,##0.00';
          }
        }
      }
    }

    return sheet;
  }

  /**
   * Generate file name for the Excel export
   */
  generateFileName(vesselName?: string): string {
    const date = new Date().toISOString().split('T')[0];
    const vessel = vesselName ? `_${this.sanitizeFileName(vesselName)}` : '';
    return `reconciliacao${vessel}_${date}.xlsx`;
  }

  /**
   * Sanitize string for use in file name
   */
  private sanitizeFileName(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .substring(0, 50);
  }
}
