import { describe, it, expect } from 'vitest';
import { CashFlowExcelExporter } from './CashFlowExcelExporter';

describe('CashFlowExcelExporter', () => {
  it('should export cash flow allocation results to Excel blob', () => {
    const exporter = new CashFlowExcelExporter();
    const totalValue = 1000;
    const numFractions = 5;
    const stdDevPercent = 25;
    const fractions = [180, 220, 190, 210, 200];

    const blob = exporter.export(totalValue, numFractions, stdDevPercent, fractions);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should generate correct filename', () => {
    const exporter = new CashFlowExcelExporter();
    const filename = exporter.generateFileName();

    expect(filename).toMatch(/^cash_flow_allocation_\d{4}-\d{2}-\d{2}\.xlsx$/);
  });
});
