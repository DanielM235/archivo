import { type FC, useState, useCallback, useRef, useEffect } from 'react';
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
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  FormLabel,
  Tooltip,
  TextField,
  Divider,
} from '@archivo/ui';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import TableChartIcon from '@mui/icons-material/TableChart';
import {
  type IContractData,
  type IContractExtractionResult,
  type IBatchExtractionResult,
  type IDiData,
  type IReconciliationSummary,
  ContractExtractorService,
  ContractCsvExporter,
  DiExtractor,
  ReconciliationService,
  ReconciliationExcelExporter,
} from '@archivo/shared';
import { getWebPdfAdapter } from '../adapters';

/**
 * Processing state type
 */
type ProcessingState = 'idle' | 'processing' | 'completed' | 'error';

/**
 * Language for CSV export headers
 */
type ExportLanguage = 'en' | 'pt';

/**
 * DI processing state type
 */
type DiProcessingState = 'idle' | 'processing' | 'extracted' | 'validated' | 'error';

/**
 * Contract Extract Page component - main view for extracting contract data from PDFs
 */
export const ContractExtractPage: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const diFileInputRef = useRef<HTMLInputElement>(null);

  // Contract state
  const [files, setFiles] = useState<File[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<IBatchExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportLanguage, setExportLanguage] = useState<ExportLanguage>('pt');
  const [vesselNameOverride, setVesselNameOverride] = useState<string>('');

  // DI state
  const [diFile, setDiFile] = useState<File | null>(null);
  const [diProcessingState, setDiProcessingState] = useState<DiProcessingState>('idle');
  const [diData, setDiData] = useState<IDiData | null>(null);
  const [diError, setDiError] = useState<string | null>(null);
  const [reconciliationSummary, setReconciliationSummary] = useState<IReconciliationSummary | null>(
    null
  );

  // Editable DI fields for validation
  const [editableVmldUsd, setEditableVmldUsd] = useState<string>('');
  const [editableUsdToBrl, setEditableUsdToBrl] = useState<string>('');
  const [editableEurToBrl, setEditableEurToBrl] = useState<string>('');

  // Initialize extractors on mount
  useEffect(() => {
    ContractExtractorService.initializeDefaultExtractors();
  }, []);

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const pdfFiles = Array.from(selectedFiles).filter(
        (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      );
      setFiles((prev) => [...prev, ...pdfFiles]);
    }
    // Reset input to allow selecting the same file again
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  /**
   * Handle drag and drop
   */
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFiles = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /**
   * Remove a file from the list
   */
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Clear all files
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
    setResults(null);
    setError(null);
    setProcessingState('idle');
  }, []);

  /**
   * Process all files
   */
  const processFiles = useCallback(async () => {
    if (files.length === 0) return;

    setProcessingState('processing');
    setError(null);
    setProgress({ current: 0, total: files.length });

    try {
      const pdfAdapter = getWebPdfAdapter();

      const batchResult = await ContractExtractorService.extractFromFiles(
        pdfAdapter,
        files,
        undefined,
        (processed, total) => {
          setProgress({ current: processed, total });
        }
      );

      // Apply vessel name override if specified
      if (vesselNameOverride.trim()) {
        batchResult.results = batchResult.results.map((result) => {
          if (result.success && result.data) {
            return {
              ...result,
              data: {
                ...result.data,
                vesselName: vesselNameOverride.trim(),
              },
            };
          }
          return result;
        });
      }

      setResults(batchResult);
      setProcessingState('completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setProcessingState('error');
    }
  }, [files, vesselNameOverride]);

  /**
   * Export results to CSV
   */
  const exportToCSV = useCallback(() => {
    if (!results) return;

    const successfulData = results.results
      .filter((r) => r.success && r.data)
      .map((r) => r.data as IContractData);

    if (successfulData.length === 0) {
      setError('No successful extractions to export');
      return;
    }

    const fileName = ContractCsvExporter.generateFileName('contracts');
    ContractCsvExporter.exportToFile(
      successfulData,
      fileName,
      { separator: ';' },
      exportLanguage === 'pt'
    );
  }, [results, exportLanguage]);

  /**
   * Handle DI file selection
   */
  const handleDiFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const isPdf =
        selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        setDiFile(selectedFile);
        setDiProcessingState('idle');
        setDiData(null);
        setDiError(null);
        setReconciliationSummary(null);
      }
    }
    if (event.target) {
      event.target.value = '';
    }
  }, []);

  /**
   * Handle DI drag and drop
   */
  const handleDiDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const droppedFiles = Array.from(event.dataTransfer.files).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );

    const firstFile = droppedFiles[0];
    if (firstFile) {
      // Take only the first PDF file for DI
      setDiFile(firstFile);
      setDiProcessingState('idle');
      setDiData(null);
      setDiError(null);
      setReconciliationSummary(null);
    }
  }, []);

  const handleDiDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  /**
   * Process DI file
   */
  const processDiFile = useCallback(async () => {
    if (!diFile) return;

    setDiProcessingState('processing');
    setDiError(null);

    try {
      const pdfAdapter = getWebPdfAdapter();
      const text = await pdfAdapter.extractText(diFile);

      const diExtractor = new DiExtractor();

      if (!diExtractor.canExtract(text)) {
        setDiError(
          'This file does not appear to be a valid DI (Declaração de Importação) document.'
        );
        setDiProcessingState('error');
        return;
      }

      const extracted = diExtractor.extract(text, diFile.name);
      setDiData(extracted);

      // Set editable fields for user validation
      setEditableVmldUsd(extracted.vmldValueUsd);
      setEditableUsdToBrl(extracted.usdToBrlRate);
      setEditableEurToBrl(extracted.eurToBrlRate);

      setDiProcessingState('extracted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error processing DI file';
      setDiError(errorMessage);
      setDiProcessingState('error');
    }
  }, [diFile]);

  /**
   * Recalculate DI values with edited inputs
   */
  const recalculateDiValues = useCallback(() => {
    if (!diData) return;

    // Parse numbers (Brazilian format)
    const parseNumber = (value: string): number => {
      if (!value) return 0;
      return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const formatNumber = (value: number, decimals: number = 2): string => {
      return value.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    };

    const usdRate = parseNumber(editableUsdToBrl);
    const eurRate = parseNumber(editableEurToBrl);
    const vmldUsd = parseNumber(editableVmldUsd);

    const usdToEurRate = eurRate > 0 ? usdRate / eurRate : 0;
    const vmldEur = vmldUsd * usdToEurRate;

    const updatedDiData: IDiData = {
      ...diData,
      vmldValueUsd: editableVmldUsd,
      usdToBrlRate: editableUsdToBrl,
      eurToBrlRate: editableEurToBrl,
      usdToEurRate: formatNumber(usdToEurRate, 4),
      vmldValueEur: formatNumber(vmldEur),
    };

    setDiData(updatedDiData);
  }, [diData, editableVmldUsd, editableUsdToBrl, editableEurToBrl]);

  /**
   * Validate and generate reconciliation summary
   */
  const validateAndGenerateSummary = useCallback(() => {
    if (!diData || !results) return;

    // Recalculate with latest values
    recalculateDiValues();

    // Get successful contracts
    const successfulContracts = results.results
      .filter((r) => r.success && r.data)
      .map((r) => r.data as IContractData);

    if (successfulContracts.length === 0) {
      setDiError('No contracts available for reconciliation');
      return;
    }

    // Create reconciliation summary
    const reconciliationService = new ReconciliationService();
    const summary = reconciliationService.createSummary(
      successfulContracts,
      diData,
      vesselNameOverride || successfulContracts[0]?.vesselName
    );

    setReconciliationSummary(summary);
    setDiProcessingState('validated');
  }, [diData, results, vesselNameOverride, recalculateDiValues]);

  /**
   * Export reconciliation to Excel
   */
  const exportToExcel = useCallback(() => {
    if (!reconciliationSummary) return;

    const exporter = new ReconciliationExcelExporter();
    const blob = exporter.export(reconciliationSummary);
    const fileName = exporter.generateFileName(reconciliationSummary.vesselName);

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [reconciliationSummary]);

  /**
   * Clear DI data and reset
   */
  const clearDiData = useCallback(() => {
    setDiFile(null);
    setDiData(null);
    setDiProcessingState('idle');
    setDiError(null);
    setReconciliationSummary(null);
    setEditableVmldUsd('');
    setEditableUsdToBrl('');
    setEditableEurToBrl('');
  }, []);

  /**
   * Render file status icon
   */
  const renderStatusIcon = (result: IContractExtractionResult) => {
    if (result.success) {
      const hasWarnings = result.data?.extractionErrors && result.data.extractionErrors.length > 0;
      if (hasWarnings) {
        return (
          <Tooltip title={`Warnings: ${result.data?.extractionErrors?.join(', ')}`}>
            <WarningIcon color="warning" />
          </Tooltip>
        );
      }
      return <CheckCircleIcon color="success" />;
    }
    return (
      <Tooltip title={result.error || 'Extraction failed'}>
        <ErrorIcon color="error" />
      </Tooltip>
    );
  };

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
      <Container maxWidth="lg">
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
          <Typography color="text.primary">Contract Extract</Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <IconButton onClick={() => navigate('/')} size="large">
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" fontWeight={600}>
              Contract Data Extraction
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Extract structured data from foreign exchange contract PDFs
            </Typography>
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* File Selection Area */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              sx={{
                border: `2px dashed ${theme.palette.divider}`,
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,application/pdf"
                multiple
                style={{ display: 'none' }}
              />
              <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Drop PDF files here or click to select
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supports multiple files. Only PDF files are accepted.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Vessel Name Override */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Vessel Name (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              If specified, this name will be used for all extracted contracts instead of the value
              from the PDF.
            </Typography>
            <TextField
              fullWidth
              label="Vessel Name"
              placeholder="Enter the vessel name (e.g., ATLANTIC VOYAGER)"
              value={vesselNameOverride}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setVesselNameOverride(e.target.value)
              }
              variant="outlined"
              size="small"
              disabled={processingState === 'processing'}
            />
          </CardContent>
        </Card>

        {/* Selected Files List */}
        {files.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Selected Files ({files.length})</Typography>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={clearFiles}
                >
                  Clear All
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {files.map((file, index) => (
                  <Chip
                    key={`${file.name}-${index}`}
                    icon={<DescriptionIcon />}
                    label={`${file.name} (${formatFileSize(file.size)})`}
                    onDelete={() => removeFile(index)}
                    variant="outlined"
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Processing Progress */}
        {processingState === 'processing' && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="body1" gutterBottom>
                Processing files... ({progress.current} / {progress.total})
              </Typography>
              <LinearProgress
                variant="determinate"
                value={progress.total > 0 ? (progress.current / progress.total) * 100 : 0}
              />
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<DescriptionIcon />}
            onClick={processFiles}
            disabled={files.length === 0 || processingState === 'processing'}
          >
            Extract Data
          </Button>

          {results && results.successCount > 0 && (
            <>
              <FormControl sx={{ ml: 2 }}>
                <FormLabel sx={{ fontSize: '0.75rem' }}>Export Language</FormLabel>
                <RadioGroup
                  row
                  value={exportLanguage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setExportLanguage(e.target.value as ExportLanguage)
                  }
                >
                  <FormControlLabel
                    value="pt"
                    control={<Radio size="small" />}
                    label="Portuguese"
                  />
                  <FormControlLabel value="en" control={<Radio size="small" />} label="English" />
                </RadioGroup>
              </FormControl>

              <Button
                variant="outlined"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
              >
                Export to CSV
              </Button>
            </>
          )}

          {processingState === 'completed' && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setResults(null);
                setProcessingState('idle');
              }}
            >
              Reset
            </Button>
          )}
        </Stack>

        {/* Results Summary */}
        {results && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Extraction Results
              </Typography>
              <Stack direction="row" spacing={3}>
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {results.totalFiles}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Files
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {results.successCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Successful
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" color="error.main">
                    {results.failureCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Failed
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Results Table */}
        {results && results.results.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Extracted Data
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 500 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>File</TableCell>
                      <TableCell>Contract Date</TableCell>
                      <TableCell>Contract #</TableCell>
                      <TableCell>Currency</TableCell>
                      <TableCell align="right">Foreign Value</TableCell>
                      <TableCell align="right">Exchange Rate</TableCell>
                      <TableCell align="right">BRL Value</TableCell>
                      <TableCell>Settlement</TableCell>
                      <TableCell>Vessel</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.results.map((result, index) => (
                      <TableRow
                        key={index}
                        sx={{
                          backgroundColor: result.success
                            ? 'inherit'
                            : theme.palette.error.light + '20',
                        }}
                      >
                        <TableCell>{renderStatusIcon(result)}</TableCell>
                        <TableCell
                          sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                        >
                          {result.sourceFile.name}
                        </TableCell>
                        {result.success && result.data ? (
                          <>
                            <TableCell>{result.data.contractDate}</TableCell>
                            <TableCell>{result.data.contractNumber}</TableCell>
                            <TableCell>{result.data.foreignCurrency}</TableCell>
                            <TableCell align="right">{result.data.foreignCurrencyValue}</TableCell>
                            <TableCell align="right">{result.data.exchangeRate}</TableCell>
                            <TableCell align="right">{result.data.localCurrencyValue}</TableCell>
                            <TableCell>{result.data.settlementDeadline}</TableCell>
                            <TableCell>{result.data.vesselName}</TableCell>
                          </>
                        ) : (
                          <TableCell colSpan={8}>
                            <Typography color="error" variant="body2">
                              {result.error}
                            </Typography>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* DI Reconciliation Section */}
        {results && results.successCount > 0 && (
          <>
            <Divider sx={{ my: 4 }} />

            <Typography variant="h5" component="h2" fontWeight={600} sx={{ mb: 3 }}>
              DI Reconciliation
            </Typography>

            {/* DI Error Alert */}
            {diError && (
              <Alert severity="error" sx={{ mb: 3 }} onClose={() => setDiError(null)}>
                {diError}
              </Alert>
            )}

            {/* DI File Selection */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box
                  onDrop={handleDiDrop}
                  onDragOver={handleDiDragOver}
                  sx={{
                    border: `2px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.action.hover,
                    },
                  }}
                  onClick={() => diFileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={diFileInputRef}
                    onChange={handleDiFileSelect}
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                  />
                  <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Drop DI PDF file here or click to select
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload the DI (Declaração de Importação) to extract VMLD and exchange rates.
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Selected DI File */}
            {diFile && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Selected DI File</Typography>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={clearDiData}
                    >
                      Clear
                    </Button>
                  </Box>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Chip icon={<DescriptionIcon />} label={diFile.name} variant="outlined" />
                    <Button
                      variant="contained"
                      onClick={processDiFile}
                      disabled={diProcessingState === 'processing'}
                    >
                      {diProcessingState === 'processing' ? 'Processing...' : 'Extract DI Data'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}

            {/* DI Data Validation */}
            {diData && diProcessingState !== 'idle' && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Validate Extracted DI Data
                  </Typography>

                  {diData.extractionErrors && diData.extractionErrors.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      Extraction warnings: {diData.extractionErrors.join(', ')}
                    </Alert>
                  )}

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Review and correct the extracted values if needed before generating the
                    reconciliation.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <TextField
                      label="VMLD (USD)"
                      value={editableVmldUsd}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditableVmldUsd(e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      helperText="e.g., 409.635,02"
                    />
                    <TextField
                      label="USD to BRL Rate"
                      value={editableUsdToBrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditableUsdToBrl(e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      helperText="e.g., 5,4000"
                    />
                    <TextField
                      label="EUR to BRL Rate"
                      value={editableEurToBrl}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditableEurToBrl(e.target.value)
                      }
                      variant="outlined"
                      size="small"
                      helperText="e.g., 5,7931"
                    />
                  </Stack>

                  {/* Calculated values display */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 2,
                      backgroundColor:
                        theme.palette.mode === 'dark'
                          ? theme.palette.grey[800]
                          : theme.palette.grey[50],
                    }}
                  >
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Calculated Values (based on inputs above)
                    </Typography>
                    <Stack direction="row" spacing={4}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          USD to EUR Rate
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {diData.usdToEurRate || '-'}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          VMLD in EUR
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {diData.vmldValueEur || '-'}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<TableChartIcon />}
                    onClick={validateAndGenerateSummary}
                  >
                    Generate Reconciliation
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Reconciliation Summary */}
            {reconciliationSummary && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6">Reconciliation Summary</Typography>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<DownloadIcon />}
                      onClick={exportToExcel}
                    >
                      Export to Excel
                    </Button>
                  </Box>

                  {reconciliationSummary.vesselName && (
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Vessel: <strong>{reconciliationSummary.vesselName}</strong>
                    </Typography>
                  )}

                  {/* Contracts Table */}
                  <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                    Contracts in EUR
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Contract #</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Currency</TableCell>
                          <TableCell align="right">Original Value</TableCell>
                          <TableCell align="right">EUR Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reconciliationSummary.contracts.map((contract, index) => (
                          <TableRow key={index}>
                            <TableCell>{contract.contractNumber}</TableCell>
                            <TableCell>{contract.contractDate}</TableCell>
                            <TableCell>{contract.foreignCurrencyType}</TableCell>
                            <TableCell align="right">{contract.foreignCurrencyValue}</TableCell>
                            <TableCell align="right">{contract.eurValue}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                          <TableCell colSpan={4} align="right">
                            <strong>Total Contracts (EUR)</strong>
                          </TableCell>
                          <TableCell align="right">
                            <strong>{reconciliationSummary.totalContractsEur}</strong>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* DI Summary */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    DI Data
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          VMLD (USD)
                        </Typography>
                        <Typography variant="body1">
                          {reconciliationSummary.di.vmldValueUsd}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          USD/BRL Rate
                        </Typography>
                        <Typography variant="body1">
                          {reconciliationSummary.di.usdToBrlRate}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          EUR/BRL Rate
                        </Typography>
                        <Typography variant="body1">
                          {reconciliationSummary.di.eurToBrlRate}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          USD/EUR Rate
                        </Typography>
                        <Typography variant="body1">
                          {reconciliationSummary.di.usdToEurRate}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          VMLD (EUR)
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {reconciliationSummary.di.vmldValueEur}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>

                  {/* Difference */}
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      backgroundColor:
                        parseFloat(
                          reconciliationSummary.differenceEur.replace(/\./g, '').replace(',', '.')
                        ) === 0
                          ? theme.palette.success.light + '20'
                          : theme.palette.warning.light + '20',
                    }}
                  >
                    <Stack direction="row" spacing={4} alignItems="center">
                      <Box>
                        <Typography variant="subtitle2">
                          Difference (DI EUR - Contracts EUR)
                        </Typography>
                        <Typography
                          variant="h5"
                          fontWeight={600}
                          color={
                            parseFloat(
                              reconciliationSummary.differenceEur
                                .replace(/\./g, '')
                                .replace(',', '.')
                            ) === 0
                              ? 'success.main'
                              : 'warning.main'
                          }
                        >
                          {reconciliationSummary.differenceEur}
                        </Typography>
                      </Box>
                      {parseFloat(
                        reconciliationSummary.differenceEur.replace(/\./g, '').replace(',', '.')
                      ) === 0 && <CheckCircleIcon color="success" sx={{ fontSize: 32 }} />}
                    </Stack>
                  </Paper>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Container>
    </Box>
  );
};
