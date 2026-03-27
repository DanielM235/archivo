import * as XLSX from 'xlsx';

/**
 * Service to export cash flow allocation results to Excel format
 */
export class CashFlowExcelExporter {
  /**
   * Export cash flow allocation results to Excel file
   */
  export(
    totalValue: number,
    numFractions: number,
    stdDevPercent: number,
    fractions: number[],
    decimalPlaces: number = 2
  ): Blob {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create results sheet
    const resultsSheet = this.createResultsSheet(
      totalValue,
      numFractions,
      stdDevPercent,
      fractions,
      decimalPlaces
    );
    XLSX.utils.book_append_sheet(workbook, resultsSheet, 'Cash Flow Allocation');

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
   * Create results sheet with cash flow allocation data
   */
  private createResultsSheet(
    totalValue: number,
    numFractions: number,
    stdDevPercent: number,
    fractions: number[],
    decimalPlaces: number
  ): XLSX.WorkSheet {
    const data: (string | number)[][] = [];

    // Header
    data.push(['Cash Flow Allocation Results']);
    data.push(['']);

    // Parameters
    data.push(['Parameters']);
    data.push(['Total Value', totalValue]);
    data.push(['Number of Fractions', numFractions]);
    data.push(['Standard Deviation (%)', stdDevPercent]);
    data.push(['']);

    // Results header
    data.push(['Results']);
    data.push(['Fraction #', 'Value', 'Percentage']);

    // Results data
    fractions.forEach((fraction, index) => {
      const percentage = (fraction / totalValue) * 100;
      data.push([
        index + 1,
        decimalPlaces >= 0 ? Number(fraction.toFixed(decimalPlaces)) : fraction,
        decimalPlaces >= 0
          ? Number(percentage.toFixed(decimalPlaces))
          : Number(percentage.toFixed(2)),
      ]);
    });

    // Total row
    const total = fractions.reduce((sum, f) => sum + f, 0);
    data.push([
      'Total',
      decimalPlaces >= 0 ? Number(total.toFixed(decimalPlaces)) : total,
      decimalPlaces >= 0 ? Number((100.0).toFixed(decimalPlaces)) : 100.0,
    ]);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 12 }, // Fraction #
      { wch: 15 }, // Value
      { wch: 12 }, // Percentage
    ];

    return worksheet;
  }

  /**
   * Generate file name for the Excel export
   */
  generateFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return `cash_flow_allocation_${date}.xlsx`;
  }
}
