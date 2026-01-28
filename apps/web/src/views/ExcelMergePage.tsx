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
  TextField,
  Checkbox,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@archivo/ui';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import TableChartIcon from '@mui/icons-material/TableChart';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import {
  type IExcelMergeResult,
  type IExcelMergeConfig,
  ExcelMergerService,
} from '@archivo/shared';

/**
 * Processing state type
 */
type ProcessingState = 'idle' | 'processing' | 'completed' | 'error';

/**
 * Excel Merge Page component - merge multiple Excel files into one
 */
export const ExcelMergePage: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergerService = useRef(new ExcelMergerService());

  // State
  const [files, setFiles] = useState<File[]>([]);
  const [processingState, setProcessingState] = useState<ProcessingState>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<IExcelMergeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [outputSheetName, setOutputSheetName] = useState<string>('Merged Data');
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set());

  /**
   * Extract available sheets from first file when files are uploaded
   */
  useEffect(() => {
    const loadSheets = async () => {
      if (files.length > 0 && availableSheets.length === 0) {
        const firstFile = files[0];
        if (!firstFile) return;

        try {
          const sheets = await mergerService.current.getSheetNames(firstFile);
          setAvailableSheets(sheets);
          // Auto-select first sheet
          if (sheets.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            setSelectedSheet(sheets[0]!);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to load sheet names');
        }
      }
    };

    loadSheets();
  }, [files, availableSheets.length]);

  /**
   * Extract headers when sheet is selected
   */
  useEffect(() => {
    const loadHeaders = async () => {
      if (files.length > 0 && selectedSheet && headers.length === 0) {
        const firstFile = files[0];
        if (!firstFile) return;

        try {
          const result = await mergerService.current.extractHeaders(firstFile, {
            targetSheetName: selectedSheet,
          });

          if (result.success && result.headers) {
            setHeaders(result.headers);
            // Select all columns by default
            setSelectedColumns(new Set(result.headers.map((_, idx) => idx)));
          } else {
            setError(result.error || 'Failed to extract headers');
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to extract headers');
        }
      }
    };

    loadHeaders();
  }, [files, selectedSheet, headers.length]);

  /**
   * Handle sheet selection change
   */
  const handleSheetChange = useCallback((newSheet: string) => {
    setSelectedSheet(newSheet);
    // Reset headers and column selection when sheet changes
    setHeaders([]);
    setSelectedColumns(new Set());
  }, []);

  /**
   * Toggle column selection
   */
  const toggleColumn = useCallback((index: number) => {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  /**
   * Select/deselect all columns
   */
  const toggleAllColumns = useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedColumns(new Set(headers.map((_, idx) => idx)));
      } else {
        setSelectedColumns(new Set());
      }
    },
    [headers]
  );

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const excelFiles = Array.from(selectedFiles).filter(
        (file) =>
          file.name.toLowerCase().endsWith('.xlsx') ||
          file.name.toLowerCase().endsWith('.xls') ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.type === 'application/vnd.ms-excel'
      );
      setFiles((prev) => [...prev, ...excelFiles]);
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
      (file) =>
        file.name.toLowerCase().endsWith('.xlsx') ||
        file.name.toLowerCase().endsWith('.xls') ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'application/vnd.ms-excel'
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
    setResult(null);
    setError(null);
    setProcessingState('idle');
    setAvailableSheets([]);
    setSelectedSheet('');
    setHeaders([]);
    setSelectedColumns(new Set());
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
      const config: IExcelMergeConfig = {
        targetSheetName: selectedSheet,
        outputSheetName: outputSheetName.trim() || 'Merged Data',
        includeMargins: true,
        selectedColumnIndices:
          selectedColumns.size > 0 ? Array.from(selectedColumns).sort((a, b) => a - b) : undefined,
      };

      const mergeResult = await mergerService.current.mergeFiles(
        files,
        config,
        (current, total) => {
          setProgress({ current, total });
        }
      );

      setResult(mergeResult);

      if (mergeResult.success) {
        setProcessingState('completed');
      } else {
        setProcessingState('error');
        setError(mergeResult.error || 'Failed to merge files');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setProcessingState('error');
    }
  }, [files, selectedSheet, outputSheetName, selectedColumns]);

  /**
   * Download merged file
   */
  const downloadMergedFile = useCallback(() => {
    if (!result?.blob) return;

    const fileName = mergerService.current.generateFileName(outputSheetName);
    const url = URL.createObjectURL(result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [result, outputSheetName]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          onClick={() => navigate('/')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            textDecoration: 'none',
            color: 'inherit',
            '&:hover': { textDecoration: 'underline' },
          }}
        >
          <HomeIcon fontSize="small" />
          Home
        </Link>
        <Typography color="text.primary">Excel Merge</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <IconButton onClick={() => navigate('/')} size="large">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <TableChartIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
              Excel Merge
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Merge multiple Excel files into a single file with one sheet
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* File Upload Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step 1: Select Excel Files
          </Typography>

          {/* Drag & Drop Area */}
          <Box
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            sx={{
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              backgroundColor: theme.palette.action.hover,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.selected,
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" gutterBottom>
              Drag & drop Excel files here, or click to select files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: .xlsx, .xls
            </Typography>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Selected Files List */}
          {files.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="subtitle1">Selected Files ({files.length})</Typography>
                <Button
                  startIcon={<DeleteIcon />}
                  onClick={clearFiles}
                  size="small"
                  color="error"
                  disabled={processingState === 'processing'}
                >
                  Clear All
                </Button>
              </Box>

              <Stack spacing={1}>
                {files.map((file, index) => (
                  <Box
                    key={`${file.name}-${index}`}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1.5,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      backgroundColor: theme.palette.background.default,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                      <TableChartIcon fontSize="small" color="action" />
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(file.size / 1024).toFixed(1)} KB
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeFile(index)}
                      disabled={processingState === 'processing'}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Sheet Selection - Step 2 */}
      {files.length > 0 && availableSheets.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Step 2: Select Sheet
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Sheet to Merge</InputLabel>
              <Select
                value={selectedSheet}
                onChange={(e) => handleSheetChange(e.target.value)}
                label="Sheet to Merge"
                disabled={processingState === 'processing'}
              >
                {availableSheets.map((sheet) => (
                  <MenuItem key={sheet} value={sheet}>
                    {sheet}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {/* Column Selection - Step 3 */}
      {selectedSheet && headers.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Step 3: Select Columns
            </Typography>
            <Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ViewColumnIcon color="primary" />
                  <Typography variant="subtitle1">
                    {selectedColumns.size} of {headers.length} columns selected
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => toggleAllColumns(true)}
                    disabled={processingState === 'processing'}
                  >
                    Select All
                  </Button>
                  <Button
                    size="small"
                    onClick={() => toggleAllColumns(false)}
                    disabled={processingState === 'processing'}
                  >
                    Deselect All
                  </Button>
                </Box>
              </Box>

              <Card variant="outlined">
                <CardContent sx={{ py: 1.5 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row',
                      overflowX: 'auto',
                      gap: 0.5,
                      py: 0.5,
                      '&::-webkit-scrollbar': {
                        height: 8,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.2)',
                        borderRadius: 4,
                      },
                    }}
                  >
                    {headers.map((header, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          minWidth: 'fit-content',
                          px: 1,
                          py: 0.5,
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          backgroundColor: selectedColumns.has(index)
                            ? 'primary.50'
                            : 'background.paper',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: selectedColumns.has(index)
                              ? 'primary.100'
                              : 'action.hover',
                          },
                        }}
                      >
                        <Checkbox
                          size="small"
                          checked={selectedColumns.has(index)}
                          onChange={() => toggleColumn(index)}
                          disabled={processingState === 'processing'}
                          sx={{ p: 0, mr: 0.5 }}
                        />
                        <Typography
                          variant="caption"
                          noWrap
                          title={header}
                          sx={{ fontWeight: 500, cursor: 'pointer' }}
                          onClick={() => toggleColumn(index)}
                        >
                          {header || `Column ${index + 1}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Configuration - Step 4 */}
      {headers.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Step 4: Output Configuration
            </Typography>
            <TextField
              label="Output Sheet Name"
              value={outputSheetName}
              onChange={(e) => setOutputSheetName(e.target.value)}
              placeholder="Merged Data"
              helperText="Name for the sheet in the output file"
              fullWidth
              required
              disabled={processingState === 'processing'}
            />
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {files.length > 0 && headers.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                onClick={processFiles}
                disabled={processingState === 'processing' || selectedColumns.size === 0}
                startIcon={<TableChartIcon />}
              >
                Merge Files
              </Button>
              {processingState === 'completed' && result?.success && (
                <Button
                  variant="contained"
                  color="success"
                  size="large"
                  onClick={downloadMergedFile}
                  startIcon={<DownloadIcon />}
                >
                  Download Merged File
                </Button>
              )}
              {processingState !== 'idle' && (
                <Button
                  variant="outlined"
                  size="large"
                  onClick={clearFiles}
                  startIcon={<RefreshIcon />}
                  disabled={processingState === 'processing'}
                >
                  Start New Merge
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {processingState === 'processing' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Processing Files... ({progress.current} / {progress.total})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(progress.current / progress.total) * 100}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Merge Results
            </Typography>

            {/* Summary */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Chip
                  icon={<CheckCircleIcon />}
                  label={`${result.successCount} Successful`}
                  color="success"
                  variant="outlined"
                />
                {result.errorCount > 0 && (
                  <Chip
                    icon={<ErrorIcon />}
                    label={`${result.errorCount} Failed`}
                    color="error"
                    variant="outlined"
                  />
                )}
                <Chip label={`${result.totalRows} Total Rows`} color="primary" variant="outlined" />
              </Stack>
            </Box>

            {/* File Results Table */}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Rows</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.fileResults.map((fileResult, index) => (
                    <TableRow key={index}>
                      <TableCell>{fileResult.file.name}</TableCell>
                      <TableCell>
                        {fileResult.status === 'completed' && (
                          <Chip
                            icon={<CheckCircleIcon />}
                            label="Success"
                            color="success"
                            size="small"
                          />
                        )}
                        {fileResult.status === 'error' && (
                          <Chip icon={<ErrorIcon />} label="Error" color="error" size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {fileResult.rowCount !== undefined ? fileResult.rowCount : '-'}
                      </TableCell>
                      <TableCell>
                        {fileResult.error && (
                          <Typography variant="caption" color="error">
                            {fileResult.error}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};
