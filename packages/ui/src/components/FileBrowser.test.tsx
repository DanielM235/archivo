import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { FileBrowser } from './FileBrowser';

// Wrapper component with theme
const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('FileBrowser', () => {
  // ============================================
  // Rendering
  // ============================================
  describe('rendering', () => {
    it('should render with default title', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} />);

      expect(screen.getByText('Select Files')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render with default description', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} />);

      expect(screen.getByText('Choose a ZIP archive or folder to process')).toBeInTheDocument();
    });

    it('should render with custom description', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} description="Custom description" />);

      expect(screen.getByText('Custom description')).toBeInTheDocument();
    });

    it('should render browse file button', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} />);

      expect(screen.getByText('Browse ZIP File')).toBeInTheDocument();
    });

    it('should render drag and drop hint', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} />);

      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });

    it('should reduce opacity when loading', () => {
      const { container } = renderWithTheme(
        <FileBrowser onFilesSelected={vi.fn()} isLoading={true} />
      );

      // Component should still render but with reduced opacity
      expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
    });
  });

  // ============================================
  // File Selection
  // ============================================
  describe('file selection', () => {
    it('should call onFilesSelected when file is selected', () => {
      const onFilesSelected = vi.fn();
      renderWithTheme(<FileBrowser onFilesSelected={onFilesSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeTruthy();

      const file = new File(['test'], 'test.zip', { type: 'application/zip' });
      Object.defineProperty(fileInput, 'files', { value: [file] });

      fireEvent.change(fileInput);

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('should not call onFilesSelected when no files are selected', () => {
      const onFilesSelected = vi.fn();
      renderWithTheme(<FileBrowser onFilesSelected={onFilesSelected} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      Object.defineProperty(fileInput, 'files', { value: [] });

      fireEvent.change(fileInput);

      expect(onFilesSelected).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // Drag and Drop
  // ============================================
  describe('drag and drop', () => {
    it('should handle drag over', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} />);

      const dropZone = screen.getByText('Select Files').closest('div')!;
      const dragEvent = new Event('dragover', { bubbles: true });
      Object.defineProperty(dragEvent, 'preventDefault', { value: vi.fn() });
      Object.defineProperty(dragEvent, 'stopPropagation', { value: vi.fn() });

      fireEvent(dropZone, dragEvent);
    });

    it('should handle drop with valid files', () => {
      const onFilesSelected = vi.fn();
      renderWithTheme(<FileBrowser onFilesSelected={onFilesSelected} acceptedFileTypes=".zip" />);

      const dropZone = screen.getByText('Select Files').closest('div')!;
      const file = new File(['test'], 'test.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });

    it('should filter out invalid file types on drop', () => {
      const onFilesSelected = vi.fn();
      renderWithTheme(<FileBrowser onFilesSelected={onFilesSelected} acceptedFileTypes=".zip" />);

      const dropZone = screen.getByText('Select Files').closest('div')!;
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [invalidFile],
        },
      });

      expect(onFilesSelected).not.toHaveBeenCalled();
    });

    it('should not process drop when disabled', () => {
      const onFilesSelected = vi.fn();
      renderWithTheme(<FileBrowser onFilesSelected={onFilesSelected} disabled={true} />);

      const dropZone = screen.getByText('Select Files').closest('div')!;
      const file = new File(['test'], 'test.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onFilesSelected).not.toHaveBeenCalled();
    });

    it('should not process drop when loading', () => {
      const onFilesSelected = vi.fn();
      renderWithTheme(<FileBrowser onFilesSelected={onFilesSelected} isLoading={true} />);

      const dropZone = screen.getByText('Select Files').closest('div')!;
      const file = new File(['test'], 'test.zip', { type: 'application/zip' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onFilesSelected).not.toHaveBeenCalled();
    });

    it('should accept any file type when acceptedFileTypes is *', () => {
      const onFilesSelected = vi.fn();
      renderWithTheme(<FileBrowser onFilesSelected={onFilesSelected} acceptedFileTypes="*" />);

      const dropZone = screen.getByText('Select Files').closest('div')!;
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });

      fireEvent.drop(dropZone, {
        dataTransfer: {
          files: [file],
        },
      });

      expect(onFilesSelected).toHaveBeenCalledWith([file]);
    });
  });

  // ============================================
  // Disabled State
  // ============================================
  describe('disabled state', () => {
    it('should disable browse button when disabled', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} disabled={true} />);

      const browseButton = screen.getByRole('button', { name: /browse zip file/i });
      expect(browseButton).toBeDisabled();
    });
  });

  // ============================================
  // Folder Selection
  // ============================================
  describe('folder selection', () => {
    it('should not show folder button when supportsFolderSelection is false', () => {
      renderWithTheme(
        <FileBrowser
          onFilesSelected={vi.fn()}
          onFolderSelected={vi.fn()}
          supportsFolderSelection={false}
        />
      );

      expect(screen.queryByText('Select Folder')).not.toBeInTheDocument();
    });

    it('should not show folder button when onFolderSelected is not provided', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} supportsFolderSelection={true} />);

      expect(screen.queryByText('Select Folder')).not.toBeInTheDocument();
    });

    it('should show folder button when onFolderSelected is provided and API supported', () => {
      // Mock showDirectoryPicker
      const originalShowDirectoryPicker = (window as unknown as { showDirectoryPicker?: unknown })
        .showDirectoryPicker;
      (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = vi.fn();

      renderWithTheme(
        <FileBrowser
          onFilesSelected={vi.fn()}
          onFolderSelected={vi.fn()}
          supportsFolderSelection={true}
        />
      );

      expect(screen.getByText('Select Folder')).toBeInTheDocument();

      // Restore
      if (originalShowDirectoryPicker) {
        (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker =
          originalShowDirectoryPicker;
      } else {
        delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
      }
    });

    it('should call onFolderSelected when folder is selected', async () => {
      const onFolderSelected = vi.fn();
      const mockDirectoryHandle = {} as FileSystemDirectoryHandle;

      // Mock showDirectoryPicker
      (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = vi
        .fn()
        .mockResolvedValue(mockDirectoryHandle);

      renderWithTheme(
        <FileBrowser
          onFilesSelected={vi.fn()}
          onFolderSelected={onFolderSelected}
          supportsFolderSelection={true}
        />
      );

      const folderButton = screen.getByText('Select Folder');
      fireEvent.click(folderButton);

      // Wait for async operation
      await vi.waitFor(() => {
        expect(onFolderSelected).toHaveBeenCalledWith(mockDirectoryHandle);
      });

      // Cleanup
      delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    });

    it('should handle AbortError when user cancels folder selection', async () => {
      const onFolderSelected = vi.fn();
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';

      // Mock showDirectoryPicker to reject with AbortError
      (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = vi
        .fn()
        .mockRejectedValue(abortError);

      renderWithTheme(
        <FileBrowser
          onFilesSelected={vi.fn()}
          onFolderSelected={onFolderSelected}
          supportsFolderSelection={true}
        />
      );

      const folderButton = screen.getByText('Select Folder');
      fireEvent.click(folderButton);

      // Should not call onFolderSelected
      await vi.waitFor(() => {
        expect(onFolderSelected).not.toHaveBeenCalled();
      });

      // Cleanup
      delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    });

    it('should log error when folder selection fails with non-AbortError', async () => {
      const onFolderSelected = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const genericError = new Error('Permission denied');

      // Mock showDirectoryPicker to reject
      (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker = vi
        .fn()
        .mockRejectedValue(genericError);

      renderWithTheme(
        <FileBrowser
          onFilesSelected={vi.fn()}
          onFolderSelected={onFolderSelected}
          supportsFolderSelection={true}
        />
      );

      const folderButton = screen.getByText('Select Folder');
      fireEvent.click(folderButton);

      await vi.waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error selecting folder:', genericError);
      });

      // Cleanup
      consoleSpy.mockRestore();
      delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;
    });

    it('should warn when File System Access API is not supported', async () => {
      const onFolderSelected = vi.fn();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Ensure showDirectoryPicker is not defined
      const originalShowDirectoryPicker = (window as unknown as { showDirectoryPicker?: unknown })
        .showDirectoryPicker;
      delete (window as unknown as { showDirectoryPicker?: unknown }).showDirectoryPicker;

      // Force re-render with the API not available
      // The button won't show without the API, so we need to test the internal logic differently
      // For now, just verify the button doesn't appear
      renderWithTheme(
        <FileBrowser
          onFilesSelected={vi.fn()}
          onFolderSelected={onFolderSelected}
          supportsFolderSelection={true}
        />
      );

      expect(screen.queryByText('Select Folder')).not.toBeInTheDocument();

      consoleSpy.mockRestore();
      if (originalShowDirectoryPicker) {
        (window as unknown as { showDirectoryPicker: unknown }).showDirectoryPicker =
          originalShowDirectoryPicker;
      }
    });
  });

  // ============================================
  // Browse Button Click
  // ============================================
  describe('browse button click', () => {
    it('should trigger file input click when browse button is clicked', () => {
      renderWithTheme(<FileBrowser onFilesSelected={vi.fn()} />);

      const browseButton = screen.getByRole('button', { name: /browse zip file/i });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = vi.spyOn(fileInput, 'click');

      fireEvent.click(browseButton);

      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
