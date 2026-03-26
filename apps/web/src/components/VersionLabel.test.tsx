import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VersionLabel } from './VersionLabel';
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
 * Helper to render with theme provider
 */
const renderWithTheme = (ui: React.ReactElement) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('VersionLabel', () => {
  beforeEach(() => {
    vi.stubGlobal('__APP_VERSION__', '1.2.3');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('__APP_VERSION__', '1.2.3');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render version from __APP_VERSION__ by default', () => {
    renderWithTheme(<VersionLabel />);

    expect(screen.getByText('v1.2.3')).toBeInTheDocument();
  });

  it('should render custom version when provided', () => {
    renderWithTheme(<VersionLabel version="2.0.0" />);

    expect(screen.getByText('v2.0.0')).toBeInTheDocument();
  });

  it('should render as a span element', () => {
    renderWithTheme(<VersionLabel />);

    const versionElement = screen.getByText('v1.2.3');
    expect(versionElement.tagName.toLowerCase()).toBe('span');
  });

  it('should have monospace font family', () => {
    renderWithTheme(<VersionLabel />);

    const versionElement = screen.getByText('v1.2.3');
    expect(versionElement).toBeInTheDocument();
  });

  it('should prefer custom version over __APP_VERSION__', () => {
    renderWithTheme(<VersionLabel version="custom-version" />);

    expect(screen.getByText('vcustom-version')).toBeInTheDocument();
    expect(screen.queryByText('v1.2.3')).not.toBeInTheDocument();
  });
});
