import type { IReconciliationSummary } from '../interfaces/IDiData';
import * as XLSX from 'xlsx';

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

    // Title
    data.push(['RECONCILIAÇÃO DE CÂMBIO']);
    data.push([]);

    // Vessel name
    if (summary.vesselName) {
      data.push(['Embarcação:', summary.vesselName]);
      data.push([]);
    }

    // DI Information
    data.push(['DADOS DA DI']);
    data.push(['VMLD (USD):', summary.di.vmldValueUsd]);
    data.push(['Taxa USD/BRL:', summary.di.usdToBrlRate]);
    data.push(['Taxa EUR/BRL:', summary.di.eurToBrlRate]);
    data.push(['Taxa USD/EUR:', summary.di.usdToEurRate]);
    data.push(['VMLD (EUR):', summary.di.vmldValueEur]);
    data.push([]);

    // Contracts summary
    data.push(['RESUMO DOS CONTRATOS']);
    data.push(['Total Contratos (EUR):', summary.totalContractsEur]);
    data.push([]);

    // Difference
    data.push(['DIFERENÇA']);
    data.push(['DI EUR - Contratos EUR:', summary.differenceEur]);

    return XLSX.utils.aoa_to_sheet(data);
  }

  /**
   * Create contracts detail sheet
   */
  private createContractsSheet(summary: IReconciliationSummary): XLSX.WorkSheet {
    const data: (string | number)[][] = [];

    // Headers
    data.push(['Nº Contrato', 'Data', 'Moeda', 'Valor Original', 'Valor EUR', 'Arquivo Origem']);

    // Contract rows
    for (const contract of summary.contracts) {
      data.push([
        contract.contractNumber,
        contract.contractDate,
        contract.foreignCurrencyType,
        contract.foreignCurrencyValue,
        contract.eurValue,
        contract.sourceFile,
      ]);
    }

    // Total row
    data.push([]);
    data.push(['', '', '', 'TOTAL:', summary.totalContractsEur, '']);

    const sheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    sheet['!cols'] = [
      { wch: 15 }, // Contract number
      { wch: 12 }, // Date
      { wch: 8 }, // Currency
      { wch: 15 }, // Original value
      { wch: 15 }, // EUR value
      { wch: 40 }, // Source file
    ];

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
