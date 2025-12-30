import { type FC, useState, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  LinearProgress,
  IconButton,
  Breadcrumbs,
  Link,
  Stack,
  Stepper,
  Step,
  StepLabel,
  useMediaQuery,
} from '@archivo/ui';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PreviewIcon from '@mui/icons-material/Preview';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import { FileBrowser, FileListView, RenameConfigForm } from '@archivo/ui';
import {
  type IRenameConfig,
  type IRenameFileInfo,
  type RenameProcessState,
  DEFAULT_RENAME_CONFIG,
  RenameService,
  ZipUtils,
  DateUtils,
} from '@archivo/shared';
import { getWebZipAdapter } from '../adapters';

/**
 * Steps for the rename process
 */
const STEPS = ['Select Source', 'Configure Options', 'Preview & Rename'];

/**
 * RenamePage component - main view for the bulk rename feature
 */
export const RenamePage: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [processState, setProcessState] = useState<RenameProcessState>('idle');
  const [activeStep, setActiveStep] = useState(0);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [files, setFiles] = useState<IRenameFileInfo[]>([]);
  const [config, setConfig] = useState<IRenameConfig>(DEFAULT_RENAME_CONFIG);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
  const [progress, setProgress] = useState<number>(0);

  /**
   * Initialize the zip adapter
   */
  const initializeAdapter = useCallback(() => {
    if (!ZipUtils.hasAdapter()) {
      ZipUtils.setAdapter(getWebZipAdapter());
    }
  }, []);

  /**
   * Handle file selection
   */
  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;

      const file = selectedFiles[0];
      if (!file) return;

      // Check if it's a zip file
      if (!file.name.toLowerCase().endsWith('.zip')) {
        setError('Please select a ZIP file');
        return;
      }

      try {
        setProcessState('selecting');
        setError(null);
        setSourceFile(file);

        // Initialize adapter
        initializeAdapter();

        // Process the zip file
        const fileInfos = await RenameService.processZipFile(file);
        setFiles(fileInfos);

        // Auto-detect source date format from filenames
        const filenames = fileInfos.map((f) => f.originalName);
        const detectedFormat = DateUtils.detectDateFormat(filenames);
        if (detectedFormat) {
          setConfig((prev) => ({
            ...prev,
            sourceDateFormat: detectedFormat,
          }));
        }

        setProcessState('loaded');
        setActiveStep(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to read ZIP file');
        setProcessState('error');
      }
    },
    [initializeAdapter]
  );

  /**
   * Handle folder selection
   */
  const handleFolderSelected = useCallback(async (directoryHandle: FileSystemDirectoryHandle) => {
    try {
      setProcessState('selecting');
      setError(null);

      // Collect file handles from the directory
      const fileHandles: FileSystemFileHandle[] = [];

      // Type assertion to use async iteration
      const iterable = directoryHandle as unknown as AsyncIterable<FileSystemHandle>;
      for await (const entry of iterable) {
        if (entry.kind === 'file') {
          fileHandles.push(entry as FileSystemFileHandle);
        }
      }

      if (fileHandles.length === 0) {
        setError('The selected folder is empty');
        setProcessState('idle');
        return;
      }

      // Process the folder
      const fileInfos = await RenameService.processFolder(fileHandles);
      setFiles(fileInfos);

      // Auto-detect source date format from filenames
      const filenames = fileInfos.map((f) => f.originalName);
      const detectedFormat = DateUtils.detectDateFormat(filenames);
      if (detectedFormat) {
        setConfig((prev) => ({
          ...prev,
          sourceDateFormat: detectedFormat,
        }));
      }

      setProcessState('loaded');
      setActiveStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read folder');
      setProcessState('error');
    }
  }, []);

  /**
   * Handle configuration change
   */
  const handleConfigChange = useCallback((newConfig: IRenameConfig) => {
    setConfig(newConfig);
  }, []);

  /**
   * Handle preview
   */
  const handlePreview = useCallback(() => {
    setProcessState('previewing');
    const previewedFiles = RenameService.previewRename(files, config);
    setFiles(previewedFiles);
    setActiveStep(2);
  }, [files, config]);

  /**
   * Handle rename execution
   */
  const handleRename = useCallback(async () => {
    if (!sourceFile) {
      setError('No source file selected');
      return;
    }

    try {
      setProcessState('renaming');
      setProgress(0);
      setError(null);

      // Initialize adapter
      initializeAdapter();

      // Execute rename
      const result = await RenameService.executeRename(sourceFile, files);

      if (result.success && result.outputBlob) {
        setOutputBlob(result.outputBlob);
        setProcessState('completed');
        setProgress(100);
      } else {
        setError(result.error || 'Rename operation failed');
        setProcessState('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename files');
      setProcessState('error');
    }
  }, [sourceFile, files, initializeAdapter]);

  /**
   * Handle download
   */
  const handleDownload = useCallback(() => {
    if (!outputBlob || !sourceFile) return;

    const outputFilename = ZipUtils.getOutputFilename(sourceFile.name);
    ZipUtils.triggerDownload(outputBlob, outputFilename);
  }, [outputBlob, sourceFile]);

  /**
   * Handle reset
   */
  const handleReset = useCallback(() => {
    setProcessState('idle');
    setActiveStep(0);
    setSourceFile(null);
    setFiles([]);
    setConfig(DEFAULT_RENAME_CONFIG);
    setError(null);
    setOutputBlob(null);
    setProgress(0);
  }, []);

  /**
   * Handle back to previous step
   */
  const handleBack = useCallback(() => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      if (activeStep === 2) {
        setProcessState('loaded');
      }
    }
  }, [activeStep]);

  /**
   * Check if can proceed to next step
   */
  const canProceed = useCallback((): boolean => {
    switch (activeStep) {
      case 0:
        return files.length > 0;
      case 1:
        return true;
      case 2:
        return processState === 'previewing' && files.some((f) => f.newName);
      default:
        return false;
    }
  }, [activeStep, files, processState]);

  /**
   * Get the number of files with errors
   */
  const errorCount = files.filter((f) => f.error).length;
  const validCount = files.filter((f) => f.newName && !f.error).length;

  return (
    <Box
      sx={{
        flexGrow: 1,
        py: { xs: 2, sm: 3, md: 4 },
        minHeight: '100vh',
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            <IconButton onClick={() => navigate('/')} size="small" aria-label="Go back to home">
              <ArrowBackIcon />
            </IconButton>
            <Breadcrumbs aria-label="breadcrumb">
              <Link
                component="button"
                underline="hover"
                color="inherit"
                onClick={() => navigate('/')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  cursor: 'pointer',
                  border: 'none',
                  background: 'none',
                  font: 'inherit',
                }}
              >
                <HomeIcon fontSize="small" />
                Home
              </Link>
              <Typography color="text.primary">Bulk Rename</Typography>
            </Breadcrumbs>
          </Box>

          <Typography variant={isMobile ? 'h5' : 'h4'} component="h1" fontWeight={700} gutterBottom>
            Bulk Rename Files
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Rename multiple files at once using date patterns and custom formatting.
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: { xs: 3, sm: 4 } }} alternativeLabel={isMobile}>
          {STEPS.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Progress bar during renaming */}
        {processState === 'renaming' && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Processing files...
            </Typography>
          </Box>
        )}

        {/* Error alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success alert */}
        {processState === 'completed' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Successfully renamed {validCount} file{validCount !== 1 ? 's' : ''}!
            {errorCount > 0 && ` (${errorCount} file${errorCount !== 1 ? 's' : ''} had errors)`}
          </Alert>
        )}

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {/* Step 1: File Selection */}
          {activeStep === 0 && (
            <FileBrowser
              onFilesSelected={handleFilesSelected}
              onFolderSelected={handleFolderSelected}
              acceptedFileTypes=".zip"
              disabled={processState === 'selecting'}
              isLoading={processState === 'selecting'}
              title="Select ZIP Archive"
              description="Choose a ZIP file containing the files you want to rename. You can also select a folder if your browser supports it."
            />
          )}

          {/* Step 2: Configuration */}
          {activeStep === 1 && (
            <Stack spacing={3}>
              <RenameConfigForm
                config={config}
                onConfigChange={handleConfigChange}
                disabled={processState === 'renaming'}
              />

              <FileListView
                files={files}
                showNewName={false}
                maxHeight={300}
                title={`Source Files (${files.length})`}
              />
            </Stack>
          )}

          {/* Step 3: Preview & Rename */}
          {activeStep === 2 && (
            <Stack spacing={3}>
              <FileListView
                files={files}
                showNewName={true}
                maxHeight={400}
                title={`Rename Preview (${validCount} valid, ${errorCount} errors)`}
              />

              {processState === 'completed' && (
                <Box
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(46, 125, 50, 0.1)'
                        : 'rgba(46, 125, 50, 0.05)',
                    borderRadius: 2,
                    border: `1px solid`,
                    borderColor: 'success.main',
                  }}
                >
                  <Typography variant="h6" color="success.main" gutterBottom>
                    Renaming Complete!
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                  >
                    Download Renamed ZIP
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Box>

        {/* Action buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep > 0 && processState !== 'completed' && (
              <Button
                variant="outlined"
                onClick={handleBack}
                disabled={processState === 'renaming'}
              >
                Back
              </Button>
            )}
            {processState === 'completed' && (
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={handleReset}>
                Start Over
              </Button>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'stretch', sm: 'flex-end' } }}>
            {activeStep === 1 && (
              <Button
                variant="contained"
                startIcon={<PreviewIcon />}
                onClick={handlePreview}
                disabled={!canProceed() || processState === 'renaming'}
                fullWidth={isMobile}
              >
                Preview Changes
              </Button>
            )}

            {activeStep === 2 && processState !== 'completed' && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<DriveFileRenameOutlineIcon />}
                onClick={handleRename}
                disabled={!canProceed() || processState === 'renaming'}
                fullWidth={isMobile}
              >
                Rename Files
              </Button>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};
