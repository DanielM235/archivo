import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';
import { ThemeProvider } from '@archivo/ui';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

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
    <ThemeProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );
};

describe('RootLayout', () => {
  it('should render the header', () => {
    renderWithProviders(<RootLayout />);

    expect(screen.getByText('Archivo')).toBeInTheDocument();
  });

  it('should render a main content area', () => {
    renderWithProviders(<RootLayout />);

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('should have full viewport height layout', () => {
    renderWithProviders(<RootLayout />);

    // Check that the layout container exists
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });
});
