import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NotFoundPage } from './NotFoundPage';
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

describe('NotFoundPage', () => {
  it('should render 404 heading', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('should render page not found message', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });

  it('should render description text', () => {
    renderWithProviders(<NotFoundPage />);

    expect(screen.getByText(/The page you are looking for does not exist/i)).toBeInTheDocument();
  });

  it('should render a link to go home', () => {
    renderWithProviders(<NotFoundPage />);

    const homeLink = screen.getByRole('link', { name: /go home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });
});
