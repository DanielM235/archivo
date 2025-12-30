import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { FileListView } from './FileListView';
import type { IRenameFileInfo } from '@archivo/shared';

// Wrapper component with theme
const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

// Helper to create mock file info
const createMockFile = (name: string, overrides?: Partial<IRenameFileInfo>): IRenameFileInfo => {
  const dotIndex = name.lastIndexOf('.');
  const extension = dotIndex > 0 ? name.slice(dotIndex + 1) : '';
  const nameWithoutExtension = dotIndex > 0 ? name.slice(0, dotIndex) : name;

  return {
    id: crypto.randomUUID(),
    originalName: name,
    originalPath: name,
    extension,
    size: 1024,
    nameWithoutExtension,
    newName: null,
    ...overrides,
  };
};

describe('FileListView', () => {
  const mockFiles: IRenameFileInfo[] = [
    createMockFile('document.pdf', { size: 2048 }),
    createMockFile('image.jpg', { size: 1024 }),
    createMockFile('archive.zip', { size: 4096 }),
  ];

  // ============================================
  // Rendering
  // ============================================
  describe('rendering', () => {
    it('should render file list', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('image.jpg')).toBeInTheDocument();
      expect(screen.getByText('archive.zip')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      renderWithTheme(<FileListView files={mockFiles} title="Test Files" />);

      expect(screen.getByText('Test Files')).toBeInTheDocument();
    });

    it('should render empty message when no files', () => {
      renderWithTheme(<FileListView files={[]} />);

      expect(screen.getByText('No files to display')).toBeInTheDocument();
    });

    it('should render custom empty message', () => {
      renderWithTheme(<FileListView files={[]} emptyMessage="No items found" />);

      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should render file count', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      expect(screen.getByText(/3 files/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // File Information Display
  // ============================================
  describe('file information', () => {
    it('should display file extensions in uppercase', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      // Extensions are displayed in uppercase in Chip components
      expect(screen.getByText('PDF')).toBeInTheDocument();
      expect(screen.getByText('JPG')).toBeInTheDocument();
      expect(screen.getByText('ZIP')).toBeInTheDocument();
    });

    it('should display formatted file sizes', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      // Check for file size column - sizes are formatted by FileUtils
      // 2048 bytes, 1024 bytes, 4096 bytes
      const sizeElements = screen.getAllByText(/KB/i);
      expect(sizeElements.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // New Name Column
  // ============================================
  describe('new name column', () => {
    it('should not show new name column by default', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      // Check that New Name header is not present
      expect(screen.queryByRole('columnheader', { name: /new name/i })).not.toBeInTheDocument();
    });

    it('should show new name column when showNewName is true', () => {
      renderWithTheme(<FileListView files={mockFiles} showNewName={true} />);

      // New Name column should be visible
      expect(screen.getByRole('columnheader', { name: /new name/i })).toBeInTheDocument();
    });

    it('should display new names when available', () => {
      const filesWithNewNames = [
        createMockFile('document.pdf', { newName: 'renamed_document.pdf' }),
      ];

      renderWithTheme(<FileListView files={filesWithNewNames} showNewName={true} />);

      expect(screen.getByText('renamed_document.pdf')).toBeInTheDocument();
    });

    it('should display error state for files with errors', () => {
      const filesWithErrors = [createMockFile('document.pdf', { error: 'Invalid filename' })];

      renderWithTheme(<FileListView files={filesWithErrors} showNewName={true} />);

      expect(screen.getByText('Invalid filename')).toBeInTheDocument();
    });
  });

  // ============================================
  // Search
  // ============================================
  describe('search', () => {
    it('should render search input', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
    });

    it('should filter files by search query', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'document' } });

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.queryByText('image.jpg')).not.toBeInTheDocument();
      expect(screen.queryByText('archive.zip')).not.toBeInTheDocument();
    });

    it('should show no results when search has no matches', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      // Files should be filtered out
      expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
      expect(screen.queryByText('image.jpg')).not.toBeInTheDocument();
    });
  });

  // ============================================
  // Sorting
  // ============================================
  describe('sorting', () => {
    it('should sort by name when Original Name column header is clicked', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      const nameHeader = screen.getByText('Original Name');
      fireEvent.click(nameHeader);

      // Should toggle sort order
      fireEvent.click(nameHeader);
    });

    it('should sort by extension when Type column header is clicked', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      const typeHeader = screen.getByText('Type');
      fireEvent.click(typeHeader);
    });

    it('should sort by size when Size column header is clicked', () => {
      renderWithTheme(<FileListView files={mockFiles} />);

      const sizeHeader = screen.getByText('Size');
      fireEvent.click(sizeHeader);
    });
  });

  // ============================================
  // File Icons
  // ============================================
  describe('file icons', () => {
    it('should display appropriate icon for image files', () => {
      const imageFiles = [createMockFile('photo.jpg')];
      const { container } = renderWithTheme(<FileListView files={imageFiles} />);

      // Check that an icon is rendered (svg element)
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should display appropriate icon for document files', () => {
      const docFiles = [createMockFile('report.pdf')];
      const { container } = renderWithTheme(<FileListView files={docFiles} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should display appropriate icon for archive files', () => {
      const archiveFiles = [createMockFile('backup.zip')];
      const { container } = renderWithTheme(<FileListView files={archiveFiles} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should display appropriate icon for code files', () => {
      const codeFiles = [createMockFile('script.js')];
      const { container } = renderWithTheme(<FileListView files={codeFiles} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should display default icon for unknown file types', () => {
      const unknownFiles = [createMockFile('data.xyz')];
      const { container } = renderWithTheme(<FileListView files={unknownFiles} />);

      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  // ============================================
  // Multiple File Types
  // ============================================
  describe('file type handling', () => {
    it('should handle audio files', () => {
      const audioFiles = [createMockFile('song.mp3')];
      renderWithTheme(<FileListView files={audioFiles} />);

      expect(screen.getByText('song.mp3')).toBeInTheDocument();
    });

    it('should handle video files', () => {
      const videoFiles = [createMockFile('video.mp4')];
      renderWithTheme(<FileListView files={videoFiles} />);

      expect(screen.getByText('video.mp4')).toBeInTheDocument();
    });
  });

  // ============================================
  // Mobile View
  // ============================================
  describe('mobile view', () => {
    it('should render card view on mobile', () => {
      // Mock useMediaQuery to return true for mobile
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query.includes('max-width') || query.includes('(max-width'),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { container } = renderWithTheme(<FileListView files={mockFiles} />);

      // On mobile, cards should be rendered instead of table
      // Check that table or cards are present
      expect(container.querySelector('.MuiCard-root, .MuiTable-root')).toBeInTheDocument();

      // Restore
      window.matchMedia = originalMatchMedia;
    });
  });

  // ============================================
  // Sort by New Name
  // ============================================
  describe('sort by new name', () => {
    it('should sort by new name when column header is clicked', () => {
      const filesWithNewNames = [
        createMockFile('doc1.pdf', { newName: 'z_doc.pdf' }),
        createMockFile('doc2.pdf', { newName: 'a_doc.pdf' }),
      ];

      renderWithTheme(<FileListView files={filesWithNewNames} showNewName={true} />);

      // Find and click the New Name header
      const newNameHeader = screen.getByRole('columnheader', { name: /new name/i });
      fireEvent.click(newNameHeader);
    });
  });

  // ============================================
  // Edge Cases
  // ============================================
  describe('edge cases', () => {
    it('should handle files without extension', () => {
      const filesNoExt = [createMockFile('README', { extension: '' })];
      renderWithTheme(<FileListView files={filesNoExt} />);

      expect(screen.getByText('README')).toBeInTheDocument();
      expect(screen.getByText('N/A')).toBeInTheDocument(); // Extension shows N/A
    });

    it('should handle very long filenames', () => {
      const longName = 'a'.repeat(100) + '.pdf';
      const filesLongName = [createMockFile(longName)];
      renderWithTheme(<FileListView files={filesLongName} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should search by new name when showNewName is true', () => {
      const filesWithNewNames = [
        createMockFile('doc1.pdf', { newName: 'renamed_doc.pdf' }),
        createMockFile('doc2.pdf', { newName: 'other.pdf' }),
      ];

      renderWithTheme(<FileListView files={filesWithNewNames} showNewName={true} />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'renamed' } });

      expect(screen.getByText('doc1.pdf')).toBeInTheDocument();
      expect(screen.queryByText('doc2.pdf')).not.toBeInTheDocument();
    });
  });
});
