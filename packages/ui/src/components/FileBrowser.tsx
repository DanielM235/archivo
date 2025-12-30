import { type FC, useRef } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArchiveIcon from '@mui/icons-material/Archive';
import UploadFileIcon from '@mui/icons-material/UploadFile';

/**
 * Props for FileBrowser component
 */
export interface IFileBrowserProps {
  /**
   * Callback when files are selected
   */
  onFilesSelected: (files: File[]) => void;

  /**
   * Callback when a folder is selected (if supported)
   */
  onFolderSelected?: (directoryHandle: FileSystemDirectoryHandle) => void;

  /**
   * Whether folder selection is supported
   */
  supportsFolderSelection?: boolean;

  /**
   * Accepted file types (e.g., '.zip')
   */
  acceptedFileTypes?: string;

  /**
   * Whether the component is disabled
   */
  disabled?: boolean;

  /**
   * Whether a file/folder is currently being processed
   */
  isLoading?: boolean;

  /**
   * Custom title
   */
  title?: string;

  /**
   * Custom description
   */
  description?: string;
}

/**
 * FileBrowser component for selecting files or folders
 * Supports drag and drop and click to browse
 */
export const FileBrowser: FC<IFileBrowserProps> = ({
  onFilesSelected,
  onFolderSelected,
  supportsFolderSelection = true,
  acceptedFileTypes = '.zip',
  disabled = false,
  isLoading = false,
  title = 'Select Files',
  description = 'Choose a ZIP archive or folder to process',
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file input change
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  /**
   * Handle browse button click
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle folder selection using File System Access API
   */
  const handleFolderClick = async () => {
    if (!onFolderSelected) return;

    try {
      // Check if showDirectoryPicker is supported
      const windowWithPicker = window as Window & {
        showDirectoryPicker?: (options?: {
          mode?: 'read' | 'readwrite';
        }) => Promise<FileSystemDirectoryHandle>;
      };

      if (windowWithPicker.showDirectoryPicker) {
        const directoryHandle = await windowWithPicker.showDirectoryPicker({
          mode: 'read',
        });
        onFolderSelected(directoryHandle);
      } else {
        console.warn('File System Access API not supported');
      }
    } catch (error) {
      // User cancelled the picker
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error selecting folder:', error);
      }
    }
  };

  /**
   * Handle drag over event
   */
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle drop event
   */
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || isLoading) return;

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      // Filter for accepted file types
      const acceptedExtensions = acceptedFileTypes
        .split(',')
        .map((ext) => ext.trim().toLowerCase());
      const validFiles = files.filter((file) => {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return acceptedExtensions.includes(ext) || acceptedFileTypes === '*';
      });

      if (validFiles.length > 0) {
        onFilesSelected(validFiles);
      }
    }
  };

  const isInteractive = !disabled && !isLoading;
  const hasDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const showFolderButton = supportsFolderSelection && onFolderSelected && hasDirectoryPicker;

  return (
    <Paper
      elevation={0}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      sx={{
        p: { xs: 3, sm: 4 },
        border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.primary.main, 0.02),
        transition: 'all 0.2s ease-in-out',
        cursor: isInteractive ? 'pointer' : 'default',
        opacity: disabled ? 0.6 : 1,
        '&:hover': isInteractive
          ? {
              borderColor: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            }
          : {},
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <UploadFileIcon
          sx={{
            fontSize: { xs: 48, sm: 64 },
            color: theme.palette.primary.main,
            opacity: 0.7,
          }}
        />

        <Typography
          variant="h6"
          component="h3"
          align="center"
          fontWeight={600}
          color="text.primary"
        >
          {title}
        </Typography>

        <Typography variant="body2" align="center" color="text.secondary" sx={{ maxWidth: 400 }}>
          {description}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mt: 1,
          }}
        >
          <Button
            variant="contained"
            startIcon={<ArchiveIcon />}
            onClick={handleBrowseClick}
            disabled={!isInteractive}
            size="large"
          >
            Browse ZIP File
          </Button>

          {showFolderButton && (
            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon />}
              onClick={handleFolderClick}
              disabled={!isInteractive}
              size="large"
            >
              Select Folder
            </Button>
          )}
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
          Or drag and drop files here
        </Typography>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </Box>
    </Paper>
  );
};
