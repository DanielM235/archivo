import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';
import { ThemeProvider } from '@archivo/ui';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
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
    <ThemeProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </ThemeProvider>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('__APP_VERSION__', '0.1.0');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render the main heading', () => {
    renderWithProviders(<HomePage />);

    expect(screen.getByText('Bulk File Operations Made Easy')).toBeInTheDocument();
  });

  it('should render the app icon', () => {
    renderWithProviders(<HomePage />);

    const icon = screen.getByAltText('Archivo');
    expect(icon).toBeInTheDocument();
    // getAssetPath prepends BASE_URL which defaults to '/'
    expect(icon).toHaveAttribute('src', expect.stringContaining('archivo-icon-animated.svg'));
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
    // 5 features have comingSoon: true (Move Files, Folder Processing, Duplicate Files, Auto Rules, Settings)
    expect(comingSoonBadges.length).toBe(5);
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

  it('should navigate to rename page when clicking Bulk Rename card', () => {
    renderWithProviders(<HomePage />);

    const bulkRenameCard = screen.getByText('Bulk Rename').closest('[class*="MuiCard"]');
    expect(bulkRenameCard).not.toBeNull();
    fireEvent.click(bulkRenameCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/rename');
  });

  it('should not navigate when clicking Coming Soon cards', () => {
    renderWithProviders(<HomePage />);

    const moveFilesCard = screen.getByText('Move Files').closest('[class*="MuiCard"]');
    expect(moveFilesCard).not.toBeNull();
    fireEvent.click(moveFilesCard!);

    // Should not navigate because it's a "Coming Soon" feature
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
