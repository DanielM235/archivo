import { type FC, useState, useCallback, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Breadcrumbs,
  Link,
  Stack,
  Paper,
} from '@archivo/ui';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import { PdfUnlockService, PdfUnlockStorage, type IPdfUnlockConfig } from '@archivo/shared';
import { getWebPdfUnlockAdapter } from '../adapters';

/**
 * PDF Unlock Page component
 */
export const PdfUnlockPage: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [numDigits, setNumDigits] = useState(4);
  const [savedConfigs, setSavedConfigs] = useState<IPdfUnlockConfig[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [unlockedBlob, setUnlockedBlob] = useState<Blob | null>(null);
  const [outputFilename, setOutputFilename] = useState('');

  // Initialize service and load saved configs
  const [service] = useState(() => new PdfUnlockService(getWebPdfUnlockAdapter()));

  /**
   * Generate date prefix in YYMMDD format
   */
  const generateDatePrefix = useCallback((): string => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Month 1-12, padded
    const day = now.getDate().toString().padStart(2, '0'); // Day 1-31, padded
    return `${year}${month}${day}`;
  }, []);

  useEffect(() => {
    // Load saved configurations
    const configs = PdfUnlockStorage.getConfigs();
    setSavedConfigs(configs);

    // Pre-fill with last used config
    const lastConfig = PdfUnlockStorage.getLastUsedConfig();
    if (lastConfig) {
      setReferenceNumber(lastConfig.referenceNumber);
      setNumDigits(lastConfig.numDigits);
    }
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === 'application/pdf') {
        setSelectedFile(file);
        setError(null);
        setSuccess(null);
        setUnlockedBlob(null);
        // Set initial output filename with date prefix
        const datePrefix = generateDatePrefix();
        setOutputFilename(`${datePrefix}-unlocked-${file.name}`);
      } else {
        setError('Please select a valid PDF file');
      }
      // Reset input
      event.target.value = '';
    },
    [generateDatePrefix]
  );

  /**
   * Handle drag and drop
   */
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();

      const files = Array.from(event.dataTransfer.files);
      const pdfFile = files.find((file) => file.type === 'application/pdf');

      if (pdfFile) {
        setSelectedFile(pdfFile);
        setError(null);
        setSuccess(null);
        setUnlockedBlob(null);
        // Set initial output filename with date prefix
        const datePrefix = generateDatePrefix();
        setOutputFilename(`${datePrefix}-unlocked-${pdfFile.name}`);
      } else {
        setError('Please drop a valid PDF file');
      }
    },
    [generateDatePrefix]
  );

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /**
   * Handle configuration selection from dropdown
   */
  const handleConfigSelect = useCallback(
    (configId: string) => {
      setSelectedConfigId(configId);
      if (configId) {
        const config = savedConfigs.find((c) => `${c.referenceNumber}-${c.numDigits}` === configId);
        if (config) {
          setReferenceNumber(config.referenceNumber);
          setNumDigits(config.numDigits);
        }
      }
    },
    [savedConfigs]
  );

  /**
   * Clear all saved configurations
   */
  const handleClearHistory = useCallback(() => {
    PdfUnlockStorage.clearConfigs();
    setSavedConfigs([]);
    setSelectedConfigId('');
  }, []);

  /**
   * Clean reference number (remove non-numeric characters and trim)
   */
  const handleCleanReference = useCallback(() => {
    const cleaned = referenceNumber.replace(/[^\d]/g, '').trim();
    setReferenceNumber(cleaned);
  }, [referenceNumber]);

  /**
   * Resolve password from inputs
   */
  const resolvePassword = useCallback((): string => {
    if (password.trim()) {
      return password.trim();
    }

    if (referenceNumber.trim() && numDigits > 0) {
      return service.derivePassword(referenceNumber.trim(), numDigits);
    }

    throw new Error('Please provide either a password or reference number with number of digits');
  }, [password, referenceNumber, numDigits, service]);

  /**
   * Handle PDF unlock
   */
  const handleUnlock = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select a PDF file first');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);
      setSuccess(null);

      const resolvedPassword = resolvePassword();

      const unlockedPdf = await service.unlockPdf(selectedFile, resolvedPassword);

      setUnlockedBlob(unlockedPdf);
      setSuccess('PDF unlocked successfully!');

      // Save successful configuration
      PdfUnlockStorage.saveConfig({
        referenceNumber: referenceNumber.trim(),
        numDigits,
      });

      // Refresh configs
      setSavedConfigs(PdfUnlockStorage.getConfigs());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlock PDF';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, resolvePassword, service, referenceNumber, numDigits]);

  /**
   * Handle download
   */
  const handleDownload = useCallback(() => {
    if (!unlockedBlob || !selectedFile) return;

    const url = URL.createObjectURL(unlockedBlob);
    const a = document.createElement('a');
    a.href = url;

    // Use custom filename if provided (trimmed), otherwise use default
    const filename = outputFilename.trim() || `unlocked-${selectedFile.name}`;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [unlockedBlob, selectedFile, outputFilename]);

  /**
   * Format file size
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Box sx={{ flexGrow: 1, py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="md">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="small" />
            Home
          </Link>
          <Typography color="text.primary">PDF Unlock</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <IconButton onClick={() => navigate('/')} size="large">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              PDF Password Remover
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Remove password protection from PDF files
            </Typography>
          </Box>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* File Selection */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Select PDF File
              </Typography>

              {!selectedFile ? (
                <Paper
                  elevation={0}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    border: `2px dashed ${theme.palette.primary.main}40`,
                    borderRadius: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      bgcolor: theme.palette.primary.main + '08',
                    },
                  }}
                >
                  <PictureAsPdfIcon
                    sx={{ fontSize: 48, color: 'primary.main', mb: 2, opacity: 0.7 }}
                  />
                  <Typography variant="h6" gutterBottom>
                    Drop your PDF file here
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Or click to browse
                  </Typography>
                  <Button variant="outlined" startIcon={<UploadFileIcon />} component="label">
                    Browse Files
                    <input type="file" accept=".pdf" hidden onChange={handleFileSelect} />
                  </Button>
                </Paper>
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <PictureAsPdfIcon color="primary" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={500}>
                      {selectedFile.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatFileSize(selectedFile.size)}
                    </Typography>
                  </Box>
                  <IconButton
                    onClick={() => {
                      setSelectedFile(null);
                      setUnlockedBlob(null);
                      setError(null);
                      setSuccess(null);
                    }}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Output Filename Configuration */}
          {selectedFile && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Output Filename
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Reference: {selectedFile.name}
                </Typography>
                <TextField
                  label="Unlocked PDF Filename"
                  value={outputFilename}
                  onChange={(e) => setOutputFilename(e.target.value)}
                  helperText="Leave empty to use default naming"
                  fullWidth
                  placeholder={`${generateDatePrefix()}-unlocked-${selectedFile.name}`}
                />
              </CardContent>
            </Card>
          )}

          {/* Password Configuration */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Password Configuration
              </Typography>

              <Stack spacing={3}>
                {/* Saved Configurations */}
                {savedConfigs.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Load Previous Configuration</InputLabel>
                      <Select
                        value={selectedConfigId}
                        onChange={(e) => handleConfigSelect(e.target.value)}
                        label="Load Previous Configuration"
                      >
                        <MenuItem value="">
                          <em>Select configuration...</em>
                        </MenuItem>
                        {savedConfigs.map((config) => (
                          <MenuItem
                            key={`${config.referenceNumber}-${config.numDigits}`}
                            value={`${config.referenceNumber}-${config.numDigits}`}
                          >
                            {config.referenceNumber} (first {config.numDigits} digits)
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleClearHistory}
                      startIcon={<DeleteIcon />}
                    >
                      Clear History
                    </Button>
                  </Box>
                )}

                {/* Password Input */}
                <TextField
                  label="Password (optional)"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Leave empty to derive password from reference number"
                  fullWidth
                />

                {/* Reference Number and Digits */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box sx={{ display: 'flex', flex: 1, gap: 1 }}>
                    <TextField
                      label="Reference Number"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      helperText="e.g., CPF or other numeric identifier"
                      fullWidth
                    />
                    <IconButton
                      onClick={handleCleanReference}
                      title="Clean reference (remove non-numeric characters)"
                      sx={{ mt: 1 }}
                    >
                      <CleaningServicesIcon />
                    </IconButton>
                  </Box>
                  <TextField
                    label="First Digits to Use"
                    type="number"
                    value={numDigits}
                    onChange={(e) => setNumDigits(Math.max(1, parseInt(e.target.value) || 1))}
                    inputProps={{ min: 1, max: 20 }}
                    sx={{ minWidth: 140 }}
                  />
                </Box>

                {/* Password Preview */}
                {referenceNumber && numDigits > 0 && !password && (
                  <Alert severity="info">
                    Derived password:{' '}
                    <strong>{service.derivePassword(referenceNumber, numDigits)}</strong>
                  </Alert>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LockOpenIcon />}
              onClick={handleUnlock}
              disabled={!selectedFile || isProcessing}
            >
              {isProcessing ? 'Unlocking...' : 'Unlock PDF'}
            </Button>

            {unlockedBlob && (
              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download Unlocked PDF
              </Button>
            )}
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};
