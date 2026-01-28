import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RenamePage } from './RenamePage';
import { ThemeProvider } from '@archivo/ui';
import { RenameService, ZipUtils, type IRenameFileInfo } from '@archivo/shared';

// Mock __APP_VERSION__
vi.stubGlobal('__APP_VERSION__', '0.1.0');

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the adapters
vi.mock('../adapters', () => ({
  getWebZipAdapter: vi.fn(() => ({
    readZipEntries: vi.fn(),
    extractEntry: vi.fn(),
    createZip: vi.fn(),
  })),
}));

// Mock RenameConfigForm to avoid DateUtils issues
vi.mock('@archivo/ui', async () => {
  const actual = await vi.importActual('@archivo/ui');
  return {
    ...actual,
    RenameConfigForm: ({
      config,
      onConfigChange,
      disabled,
    }: {
      config: unknown;
      onConfigChange: (c: unknown) => void;
      disabled?: boolean;
    }) => (
      <div data-testid="rename-config-form">
        <span>Config Form Mock</span>
        <button onClick={() => onConfigChange(config)} disabled={disabled}>
          Update Config
        </button>
      </div>
    ),
  };
});

// Mock services - keep RenameService and ZipUtils as mocked versions
vi.mock('@archivo/shared', async () => {
  const actual = await vi.importActual('@archivo/shared');
  return {
    ...actual,
    RenameService: {
      processZipFile: vi.fn(),
      processFolder: vi.fn(),
      previewRename: vi.fn(),
      executeRename: vi.fn(),
    },
    ZipUtils: {
      hasAdapter: vi.fn(() => true),
      setAdapter: vi.fn(),
      getOutputFilename: vi.fn((name: string) => `renamed-${name}`),
      triggerDownload: vi.fn(),
    },
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

/**
 * Mock file info helper
 */
const createMockFileInfo = (name: string, newName?: string): IRenameFileInfo => ({
  originalName: name,
  extension: name.split('.').pop() || '',
  size: 1024,
  newName,
  dateFromFilename: new Date(),
  sortOrder: 1,
});

describe('RenamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMatchMedia(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial rendering', () => {
    it('should render the page heading', () => {
      renderWithProviders(<RenamePage />);
      expect(screen.getByText('Bulk Rename Files')).toBeInTheDocument();
    });

    it('should render the description', () => {
      renderWithProviders(<RenamePage />);
      expect(
        screen.getByText(/Rename multiple files at once using date patterns/i)
      ).toBeInTheDocument();
    });

    it('should render the stepper with all steps', () => {
      renderWithProviders(<RenamePage />);
      expect(screen.getByText('Select Source')).toBeInTheDocument();
      expect(screen.getByText('Configure Options')).toBeInTheDocument();
      expect(screen.getByText('Preview & Rename')).toBeInTheDocument();
    });

    it('should render breadcrumbs', () => {
      renderWithProviders(<RenamePage />);
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Bulk Rename')).toBeInTheDocument();
    });

    it('should render the file browser on step 1', () => {
      renderWithProviders(<RenamePage />);
      expect(screen.getByText('Select ZIP Archive')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to home when clicking the back button', () => {
      renderWithProviders(<RenamePage />);

      const backButton = screen.getByRole('button', { name: /go back to home/i });
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to home when clicking Home breadcrumb', () => {
      renderWithProviders(<RenamePage />);

      // Find the Home link within breadcrumbs - it's a button with Home icon and text
      const breadcrumbs = screen.getByLabelText('breadcrumb');
      const homeLink = breadcrumbs.querySelector('button');
      expect(homeLink).not.toBeNull();
      fireEvent.click(homeLink!);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('File selection', () => {
    it('should not process non-zip files (filtered by FileBrowser)', async () => {
      // FileBrowser filters files by acceptedFileTypes before calling onFilesSelected
      // So non-zip files are silently ignored at the FileBrowser level
      renderWithProviders(<RenamePage />);

      const dropZone = screen.getByText(/drag and drop/i);
      const nonZipFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });

      // Simulate dropping a file - FileBrowser will filter it out
      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [nonZipFile],
          types: ['Files'],
        },
      });

      // The page should still be on step 1 since invalid files are filtered
      await waitFor(() => {
        expect(screen.getByText('Select ZIP Archive')).toBeInTheDocument();
      });

      // processZipFile should not have been called
      expect(RenameService.processZipFile).not.toHaveBeenCalled();
    });

    it('should process zip file and advance to step 2', async () => {
      const mockFiles: IRenameFileInfo[] = [
        createMockFileInfo('2024-01-01_photo.jpg'),
        createMockFileInfo('2024-01-02_photo.jpg'),
      ];

      vi.mocked(RenameService.processZipFile).mockResolvedValue(mockFiles);

      renderWithProviders(<RenamePage />);

      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(RenameService.processZipFile).toHaveBeenCalledWith(zipFile);
      });

      await waitFor(() => {
        expect(screen.getByText(/Source Files/i)).toBeInTheDocument();
      });
    });

    it('should handle zip file processing error', async () => {
      vi.mocked(RenameService.processZipFile).mockRejectedValue(new Error('Corrupted zip file'));

      renderWithProviders(<RenamePage />);

      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Corrupted zip file')).toBeInTheDocument();
      });
    });
  });

  describe('Step 2: Configuration', () => {
    beforeEach(async () => {
      const mockFiles: IRenameFileInfo[] = [
        createMockFileInfo('2024-01-01_photo.jpg'),
        createMockFileInfo('2024-01-02_photo.jpg'),
      ];

      vi.mocked(RenameService.processZipFile).mockResolvedValue(mockFiles);
    });

    it('should show rename config form in step 2', async () => {
      renderWithProviders(<RenamePage />);

      // Upload a file first
      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/Preview Changes/i)).toBeInTheDocument();
      });
    });

    it('should show file list in step 2', async () => {
      renderWithProviders(<RenamePage />);

      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/Source Files \(2\)/i)).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Preview and Rename', () => {
    it('should preview rename and show results', async () => {
      const mockFiles: IRenameFileInfo[] = [
        createMockFileInfo('2024-01-01_photo.jpg'),
        createMockFileInfo('2024-01-02_photo.jpg'),
      ];

      vi.mocked(RenameService.processZipFile).mockResolvedValue(mockFiles);
      vi.mocked(RenameService.previewRename).mockImplementation((files) =>
        files.map((f) => ({ ...f, newName: `renamed_${f.originalName}` }))
      );

      renderWithProviders(<RenamePage />);

      // Upload file
      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/Preview Changes/i)).toBeInTheDocument();
      });

      // Click preview button
      const previewButton = screen.getByRole('button', { name: /Preview Changes/i });
      fireEvent.click(previewButton);

      await waitFor(() => {
        expect(RenameService.previewRename).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Rename Preview/i)).toBeInTheDocument();
      });
    });

    it('should execute rename and show success', async () => {
      const mockFiles: IRenameFileInfo[] = [createMockFileInfo('2024-01-01_photo.jpg')];

      vi.mocked(RenameService.processZipFile).mockResolvedValue(mockFiles);
      vi.mocked(RenameService.previewRename).mockImplementation((files) =>
        files.map((f) => ({ ...f, newName: `renamed_${f.originalName}` }))
      );

      const mockOutputBlob = new Blob(['zip content']);
      vi.mocked(RenameService.executeRename).mockResolvedValue({
        success: true,
        outputBlob: mockOutputBlob,
      });

      renderWithProviders(<RenamePage />);

      // Upload file
      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Preview Changes/i })).toBeInTheDocument();
      });

      // Click preview button
      fireEvent.click(screen.getByRole('button', { name: /Preview Changes/i }));

      await waitFor(() => {
        expect(RenameService.previewRename).toHaveBeenCalled();
      });

      // Wait for step 3 UI - the Rename Files button should appear
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Rename Files/i })).toBeInTheDocument();
      });

      // Click rename button
      fireEvent.click(screen.getByRole('button', { name: /Rename Files/i }));

      await waitFor(() => {
        expect(RenameService.executeRename).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/Renaming Complete/i)).toBeInTheDocument();
      });
    });

    it('should handle rename error', async () => {
      const mockFiles: IRenameFileInfo[] = [createMockFileInfo('2024-01-01_photo.jpg')];

      vi.mocked(RenameService.processZipFile).mockResolvedValue(mockFiles);
      vi.mocked(RenameService.previewRename).mockImplementation((files) =>
        files.map((f) => ({ ...f, newName: `renamed_${f.originalName}` }))
      );

      vi.mocked(RenameService.executeRename).mockResolvedValue({
        success: false,
        error: 'Failed to create output file',
      });

      renderWithProviders(<RenamePage />);

      // Upload file
      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Preview Changes/i })).toBeInTheDocument();
      });

      // Click preview button
      fireEvent.click(screen.getByRole('button', { name: /Preview Changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Rename Files/i })).toBeInTheDocument();
      });

      // Click rename button
      fireEvent.click(screen.getByRole('button', { name: /Rename Files/i }));

      await waitFor(() => {
        expect(screen.getByText('Failed to create output file')).toBeInTheDocument();
      });
    });
  });

  describe('Download and Reset', () => {
    it('should trigger download when clicking download button', async () => {
      const mockOutputBlob = new Blob(['zip content']);
      vi.mocked(RenameService.processZipFile).mockResolvedValue([createMockFileInfo('photo.jpg')]);
      vi.mocked(RenameService.previewRename).mockImplementation((files) =>
        files.map((f) => ({ ...f, newName: `renamed_${f.originalName}` }))
      );
      vi.mocked(RenameService.executeRename).mockResolvedValue({
        success: true,
        outputBlob: mockOutputBlob,
      });

      renderWithProviders(<RenamePage />);

      // Upload file
      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Preview Changes/i })).toBeInTheDocument();
      });

      // Preview
      fireEvent.click(screen.getByRole('button', { name: /Preview Changes/i }));

      await waitFor(() => {
        expect(RenameService.previewRename).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Rename Files/i })).toBeInTheDocument();
      });

      // Rename
      fireEvent.click(screen.getByRole('button', { name: /Rename Files/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Download Renamed ZIP/i })).toBeInTheDocument();
      });

      // Download
      fireEvent.click(screen.getByRole('button', { name: /Download Renamed ZIP/i }));

      expect(ZipUtils.triggerDownload).toHaveBeenCalledWith(mockOutputBlob, 'renamed-photos.zip');
    });

    it('should reset state when clicking start over', async () => {
      const mockOutputBlob = new Blob(['zip content']);
      vi.mocked(RenameService.processZipFile).mockResolvedValue([createMockFileInfo('photo.jpg')]);
      vi.mocked(RenameService.previewRename).mockImplementation((files) =>
        files.map((f) => ({ ...f, newName: `renamed_${f.originalName}` }))
      );
      vi.mocked(RenameService.executeRename).mockResolvedValue({
        success: true,
        outputBlob: mockOutputBlob,
      });

      renderWithProviders(<RenamePage />);

      // Go through the full flow
      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Preview Changes/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Preview Changes/i }));

      await waitFor(() => {
        expect(RenameService.previewRename).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Rename Files/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Rename Files/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Start Over/i })).toBeInTheDocument();
      });

      // Click start over
      fireEvent.click(screen.getByRole('button', { name: /Start Over/i }));

      await waitFor(() => {
        expect(screen.getByText('Select ZIP Archive')).toBeInTheDocument();
      });
    });
  });

  describe('Back navigation', () => {
    it('should go back to step 1 from step 2', async () => {
      vi.mocked(RenameService.processZipFile).mockResolvedValue([createMockFileInfo('photo.jpg')]);

      renderWithProviders(<RenamePage />);

      // Upload file
      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByText(/Preview Changes/i)).toBeInTheDocument();
      });

      // Click back button
      const backButton = screen.getByRole('button', { name: /^Back$/i });
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByText('Select ZIP Archive')).toBeInTheDocument();
      });
    });
  });

  describe('Mobile view', () => {
    it('should render properly on mobile', () => {
      mockMatchMedia(true);
      renderWithProviders(<RenamePage />);

      // Page should still render
      expect(screen.getByText('Bulk Rename Files')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should dismiss error when clicking close', async () => {
      vi.mocked(RenameService.processZipFile).mockRejectedValue(new Error('Test error'));

      renderWithProviders(<RenamePage />);

      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Close the error alert
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
      });
    });

    it('should handle non-Error exception during zip processing', async () => {
      vi.mocked(RenameService.processZipFile).mockRejectedValue('String error message');

      renderWithProviders(<RenamePage />);

      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to read ZIP file')).toBeInTheDocument();
      });
    });

    it('should handle exception during rename execution', async () => {
      vi.mocked(RenameService.processZipFile).mockResolvedValue([createMockFileInfo('photo.jpg')]);
      vi.mocked(RenameService.previewRename).mockImplementation((files) =>
        files.map((f) => ({ ...f, newName: `renamed_${f.originalName}` }))
      );
      vi.mocked(RenameService.executeRename).mockRejectedValue(new Error('Execution failed'));

      renderWithProviders(<RenamePage />);

      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Preview Changes/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Preview Changes/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Rename Files/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Rename Files/i }));

      await waitFor(() => {
        expect(screen.getByText('Execution failed')).toBeInTheDocument();
      });
    });
  });

  describe('ZipUtils adapter initialization', () => {
    it('should initialize zip adapter if not already set', async () => {
      vi.mocked(ZipUtils.hasAdapter).mockReturnValue(false);
      vi.mocked(RenameService.processZipFile).mockResolvedValue([createMockFileInfo('photo.jpg')]);

      renderWithProviders(<RenamePage />);

      const dropZone = screen.getByText(/drag and drop/i);
      const zipFile = new File(['content'], 'photos.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone.parentElement!, {
        dataTransfer: {
          files: [zipFile],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(ZipUtils.setAdapter).toHaveBeenCalled();
      });
    });
  });
});
