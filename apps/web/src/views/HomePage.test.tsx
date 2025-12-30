import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { ThemeProvider } from '@archivo/ui';

// Mock __APP_VERSION__
vi.stubGlobal('__APP_VERSION__', '0.1.0');

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
    <ThemeProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );
};

describe('HomePage', () => {
  it('should render the main heading', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Bulk File Operations Made Easy')).toBeInTheDocument();
  });

  it('should render the app icon', () => {
    renderWithProviders(<HomePage />);

    const icon = screen.getByAltText('Archivo');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', '/archivo-icon-animated.svg');
  });

  it('should render the description', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByText(/Rename, move, and organize thousands of files in seconds/i)
    ).toBeInTheDocument();
  });

  it('should render all feature cards', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Bulk Rename')).toBeInTheDocument();
    expect(screen.getByText('Move Files')).toBeInTheDocument();
    expect(screen.getByText('Folder Processing')).toBeInTheDocument();
    expect(screen.getByText('Duplicate Files')).toBeInTheDocument();
    expect(screen.getByText('Auto Rules')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should render feature descriptions', () => {
    renderWithProviders(<HomePage />);

    expect(
      screen.getByText(/Rename multiple files at once using patterns, regex, or custom rules/i)
    ).toBeInTheDocument();
  });

  it('should render Coming Soon badges on feature cards', () => {
    renderWithProviders(<HomePage />);

    const comingSoonBadges = screen.getAllByText('Coming Soon');
    expect(comingSoonBadges.length).toBe(6);
  });

  it('should render the version label', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('v0.1.0')).toBeInTheDocument();
  });

  it('should render correctly on mobile viewport', () => {
    // Mock mobile viewport
    mockMatchMedia(true);

    renderWithProviders(<HomePage />);

    expect(screen.getByText('Bulk File Operations Made Easy')).toBeInTheDocument();
    expect(screen.getByText('Bulk Rename')).toBeInTheDocument();

    // Reset to desktop
    mockMatchMedia(false);
  });
});
