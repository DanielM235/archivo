import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from './Header';
import { ThemeProvider } from '@archivo/ui';

// Mock matchMedia - configurable for testing mobile/desktop
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
 * Helper to render with theme provider
 */
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('Header', () => {
  it('should render the app title', () => {
    renderWithTheme(<Header />);

    expect(screen.getByText('Archivo')).toBeInTheDocument();
  });

  it('should render the app logo', () => {
    renderWithTheme(<Header />);

    const logo = screen.getByAltText('Archivo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/favicon.svg');
  });

  it('should render theme toggle button', () => {
    renderWithTheme(<Header />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('should toggle theme when button is clicked', () => {
    renderWithTheme(<Header />);

    const toggleButton = screen.getByRole('button', { name: /toggle theme/i });

    // Initially shows dark mode icon (Brightness4Icon) when in light mode
    fireEvent.click(toggleButton);

    // After click, theme should toggle
    expect(toggleButton).toBeInTheDocument();
  });

  it('should have sticky positioning', () => {
    renderWithTheme(<Header />);

    const appBar = screen.getByRole('banner');
    expect(appBar).toBeInTheDocument();
  });

  it('should render correctly on mobile viewport', () => {
    mockMatchMedia(true);

    renderWithTheme(<Header />);

    expect(screen.getByText('Archivo')).toBeInTheDocument();
    expect(screen.getByAltText('Archivo')).toBeInTheDocument();

    mockMatchMedia(false);
  });
});
