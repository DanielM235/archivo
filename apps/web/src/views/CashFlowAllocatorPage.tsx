import { type FC, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  Breadcrumbs,
  Link,
  Stack,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@archivo/ui';
import { Popover } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import HelpIcon from '@mui/icons-material/Help';
import DownloadIcon from '@mui/icons-material/Download';
import { generateFractions } from '@archivo/shared';
import { CashFlowExcelExporter } from '@archivo/shared';

/**
 * Cash Flow Allocator Page component
 */
export const CashFlowAllocatorPage: FC = () => {
  const navigate = useNavigate();

  // State
  const [totalValue, setTotalValue] = useState<string>('100000');
  const [numFractions, setNumFractions] = useState<string>('4');
  const [stdDevPercent, setStdDevPercent] = useState<string>('25');
  const [decimalPlaces, setDecimalPlaces] = useState<string>('-2');
  const [fractions, setFractions] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [helpAnchorEl, setHelpAnchorEl] = useState<HTMLButtonElement | null>(null);

  /**
   * Format a number based on decimal places setting
   */
  const formatNumber = (num: number, decimals: number): string => {
    if (decimals >= 0) {
      return num.toFixed(decimals);
    } else {
      // For negative decimals, numbers are already rounded to powers of 10
      return num.toString();
    }
  };

  /**
   * Format a percentage based on decimal places setting
   */
  const formatPercentage = (fraction: number, total: number, decimals: number): string => {
    const percentage = (fraction / total) * 100;
    if (decimals >= 0) {
      return percentage.toFixed(decimals);
    } else {
      // For negative decimals, use 2 decimal places for percentages
      return percentage.toFixed(2);
    }
  };
  const handleHelpClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHelpAnchorEl(event.currentTarget);
  };

  /**
   * Handle help popover close
   */
  const handleHelpClose = () => {
    setHelpAnchorEl(null);
  };

  const isHelpOpen = Boolean(helpAnchorEl);

  /**
   * Handle generate fractions
   */
  const handleGenerate = () => {
    try {
      setError(null);
      const K = parseFloat(totalValue);
      const n = parseInt(numFractions, 10);
      const sdPercent = parseFloat(stdDevPercent);
      const decimals = parseInt(decimalPlaces, 10);

      if (isNaN(K) || K <= 0) {
        throw new Error('Total value must be a positive number');
      }
      if (isNaN(n) || n <= 0) {
        throw new Error('Number of fractions must be a positive integer');
      }
      if (isNaN(sdPercent) || sdPercent < 0) {
        throw new Error('Standard deviation must be a non-negative number');
      }
      if (isNaN(decimals)) {
        throw new Error('Decimal places must be an integer');
      }

      const result = generateFractions(K, n, sdPercent);

      // Round the results to the specified number of decimal places
      let roundedResult: number[];
      if (decimals >= 0) {
        // Positive decimals: round to decimal places
        roundedResult = result.map(
          (fraction) => Math.round(fraction * Math.pow(10, decimals)) / Math.pow(10, decimals)
        );
      } else {
        // Negative decimals: round to powers of 10
        const power = Math.pow(10, -decimals);
        const roundedFractions = result
          .slice(0, -1)
          .map((fraction) => Math.round(fraction / power) * power);

        // Last value contains the difference to match total (not rounded)
        const currentSum = roundedFractions.reduce((sum, f) => sum + f, 0);
        const lastValue = K - currentSum;
        roundedFractions.push(lastValue);

        roundedResult = roundedFractions;
      }

      setFractions(roundedResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  /**
   * Handle regenerate
   */
  const handleRegenerate = () => {
    handleGenerate();
  };

  /**
   * Handle export to Excel
   */
  const handleExportToExcel = () => {
    if (fractions.length === 0) return;

    const exporter = new CashFlowExcelExporter();
    const blob = exporter.export(
      parseFloat(totalValue),
      parseInt(numFractions, 10),
      parseFloat(stdDevPercent),
      fractions,
      parseInt(decimalPlaces)
    );
    const fileName = exporter.generateFileName();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary">Cash Flow Allocator</Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/')}
            size="small"
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Stochastic Cash Flow Allocator
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Randomly split a financial value into fractions using normal distribution with specified
          standard deviation.
        </Typography>
      </Box>

      {/* Input Form */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Configuration
          </Typography>
          <Stack spacing={3} direction={{ xs: 'column', sm: 'row' }}>
            <TextField
              label="Total Value (K)"
              type="number"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Number of Fractions (n)"
              type="number"
              value={numFractions}
              onChange={(e) => setNumFractions(e.target.value)}
              fullWidth
              inputProps={{ min: 1, step: 1 }}
            />
            <TextField
              label="Standard Deviation (%)"
              type="number"
              value={stdDevPercent}
              onChange={(e) => setStdDevPercent(e.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.1 }}
              InputProps={{
                endAdornment: (
                  <IconButton size="small" onClick={handleHelpClick}>
                    <HelpIcon fontSize="small" />
                  </IconButton>
                ),
              }}
            />
            <TextField
              label="Decimal Places"
              type="number"
              value={decimalPlaces}
              onChange={(e) => setDecimalPlaces(e.target.value)}
              fullWidth
              inputProps={{ step: 1 }}
              helperText="Decimal places (positive) or rounding power of 10 (negative). Last value adjusts to match total."
            />
          </Stack>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<ShuffleIcon />}
              onClick={handleGenerate}
              size="large"
            >
              Generate Fractions
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {fractions.length > 0 && (
        <Card>
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <Typography variant="h6">Generated Fractions</Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<ShuffleIcon />}
                  onClick={handleRegenerate}
                  size="small"
                >
                  Regenerate
                </Button>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={handleExportToExcel}
                  size="small"
                  color="success"
                >
                  Download Excel
                </Button>
              </Stack>
            </Stack>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fraction #</TableCell>
                    <TableCell align="right">Value</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fractions.map((fraction, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell align="right">
                        {formatNumber(fraction, parseInt(decimalPlaces))}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(
                          fraction,
                          parseFloat(totalValue),
                          parseInt(decimalPlaces)
                        )}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatNumber(
                        fractions.reduce((sum, f) => sum + f, 0),
                        parseInt(decimalPlaces)
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      100.00%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Help Popover */}
      <Popover
        open={isHelpOpen}
        anchorEl={helpAnchorEl}
        onClose={handleHelpClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 300 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Standard Deviation (%)
          </Typography>
          <Typography variant="body2">
            This value represents the variability of the cash flow fractions as a percentage of the
            mean value (Total Value ÷ Number of Fractions).
            <br />
            <br />
            For example, if Total Value is 1000 and Number of Fractions is 5, the mean is 200. A 25%
            standard deviation means the fractions will typically vary by about 50 around the mean
            (200 ± 50).
            <br />
            <br />
            Higher values create more spread in the distribution, lower values create fractions
            closer to the mean.
          </Typography>
        </Box>
      </Popover>
    </Container>
  );
};
