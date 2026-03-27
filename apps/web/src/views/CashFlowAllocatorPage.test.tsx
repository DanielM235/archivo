import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CashFlowAllocatorPage } from './CashFlowAllocatorPage';
import { ThemeProvider } from '@archivo/ui';

// Mock generateFractions
vi.mock('@archivo/shared', async () => {
  const actual = await vi.importActual('@archivo/shared');
  return {
    ...actual,
    generateFractions: vi.fn(() => [56150, 38650, 32702]), // Raw values that round to 56200, 38700, and remainder 32702
  };
});

// Mock matchMedia - default to desktop
const mockMatchMedia = (matches: boolean = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Initialize with desktop view
mockMatchMedia(false);

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    clear: vi.fn(),
  },
});

/**
 * Helper to render with providers
 */
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <MemoryRouter>
      <ThemeProvider>{ui}</ThemeProvider>
    </MemoryRouter>
  );
};

describe('CashFlowAllocatorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the page heading', () => {
    renderWithProviders(<CashFlowAllocatorPage />);
    expect(screen.getByText('Stochastic Cash Flow Allocator')).toBeInTheDocument();
  });

  it('should render all form fields', () => {
    renderWithProviders(<CashFlowAllocatorPage />);
    expect(screen.getByLabelText('Total Value (K)')).toBeInTheDocument();
    expect(screen.getByLabelText('Number of Fractions (n)')).toBeInTheDocument();
    expect(screen.getByLabelText('Standard Deviation (%)')).toBeInTheDocument();
    expect(screen.getByLabelText('Decimal Places')).toBeInTheDocument();
  });

  it('should have default decimal places set to -2', () => {
    renderWithProviders(<CashFlowAllocatorPage />);
    const decimalInput = screen.getByLabelText('Decimal Places') as HTMLInputElement;
    expect(decimalInput.value).toBe('-2');
  });

  it('should generate fractions with negative decimal places without error', async () => {
    renderWithProviders(<CashFlowAllocatorPage />);

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Total Value (K)'), { target: { value: '127602' } });
    fireEvent.change(screen.getByLabelText('Number of Fractions (n)'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Standard Deviation (%)'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Decimal Places'), { target: { value: '-2' } });

    // Click generate button
    fireEvent.click(screen.getByRole('button', { name: /generate fractions/i }));

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Generated Fractions')).toBeInTheDocument();
    });

    // Check that results are displayed without errors
    expect(screen.getByText('Total')).toBeInTheDocument();

    // Verify that the total equals the input value
    const totalCell = screen.getAllByText('127602')[0]; // Should find the total value
    expect(totalCell).toBeInTheDocument();

    // Verify the fractions are rounded correctly
    // First two should be rounded to hundreds, last should be the remainder
    const tableRows = screen.getAllByRole('row');
    expect(tableRows).toHaveLength(5); // Header + 3 data rows + total row

    // Check specific values (based on our mock)
    // 56150 rounds to 56200, 38650 rounds to 38700, remainder is 32702
    const cells = screen.getAllByRole('cell');
    expect(cells.some((cell) => cell.textContent === '56200')).toBe(true);
    expect(cells.some((cell) => cell.textContent === '38700')).toBe(true);
    expect(cells.some((cell) => cell.textContent === '32702')).toBe(true);
  });

  it('should handle positive decimal places correctly', async () => {
    renderWithProviders(<CashFlowAllocatorPage />);

    // Fill form with valid data
    fireEvent.change(screen.getByLabelText('Total Value (K)'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Number of Fractions (n)'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Standard Deviation (%)'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Decimal Places'), { target: { value: '2' } });

    // Click generate button
    fireEvent.click(screen.getByRole('button', { name: /generate fractions/i }));

    // Wait for results to appear
    await waitFor(() => {
      expect(screen.getByText('Generated Fractions')).toBeInTheDocument();
    });

    // Check that decimal formatting is applied
    const tableCells = screen.getAllByRole('cell');
    // Should find cells with decimal formatting like "123.45"
    const decimalCells = tableCells.filter((cell) => /\d+\.\d{2}/.test(cell.textContent || ''));
    expect(decimalCells.length).toBeGreaterThan(0);
  });

  it('should ensure total is always exact with negative decimal places', async () => {
    renderWithProviders(<CashFlowAllocatorPage />);

    // Fill form with test data
    fireEvent.change(screen.getByLabelText('Total Value (K)'), { target: { value: '127602' } });
    fireEvent.change(screen.getByLabelText('Number of Fractions (n)'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Standard Deviation (%)'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Decimal Places'), { target: { value: '-2' } });

    fireEvent.click(screen.getByRole('button', { name: /generate fractions/i }));

    await waitFor(() => {
      expect(screen.getByText('Generated Fractions')).toBeInTheDocument();
    });

    // Extract fraction values from the table (skip header and percentages)
    const rows = screen.getAllByRole('row');
    const fractionValues: number[] = [];

    // Skip header row, process data rows
    for (let i = 1; i < rows.length - 1; i++) {
      // -1 to skip total row
      const cells = rows[i].querySelectorAll('td');
      if (cells.length >= 2) {
        const valueText = cells[1].textContent || '';
        const value = parseFloat(valueText);
        if (!isNaN(value)) {
          fractionValues.push(value);
        }
      }
    }

    const sum = fractionValues.reduce((a, b) => a + b, 0);

    // Total should be exactly 127602
    expect(sum).toBe(127602);
  });

  it.skip('should export to Excel successfully', async () => {
    renderWithProviders(<CashFlowAllocatorPage />);

    // Fill form and generate results
    fireEvent.change(screen.getByLabelText('Total Value (K)'), { target: { value: '100000' } });
    fireEvent.change(screen.getByLabelText('Number of Fractions (n)'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Standard Deviation (%)'), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText('Decimal Places'), { target: { value: '-2' } });

    fireEvent.click(screen.getByRole('button', { name: /generate fractions/i }));

    await waitFor(() => {
      expect(screen.getByText('Generated Fractions')).toBeInTheDocument();
    });

    // Click export button - just check that it doesn't throw an error
    const exportButton = screen.getByRole('button', { name: /download excel/i });
    expect(() => fireEvent.click(exportButton)).not.toThrow();
  });

  it('should show error for invalid decimal places', async () => {
    renderWithProviders(<CashFlowAllocatorPage />);

    // Fill form with invalid decimal places
    fireEvent.change(screen.getByLabelText('Total Value (K)'), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText('Number of Fractions (n)'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Standard Deviation (%)'), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText('Decimal Places'), { target: { value: 'abc' } });

    // Click generate button
    fireEvent.click(screen.getByRole('button', { name: /generate fractions/i }));

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText('Decimal places must be an integer')).toBeInTheDocument();
    });
  });
});
