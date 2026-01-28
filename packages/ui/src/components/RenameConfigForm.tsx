import { type FC, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { IRenameConfig, SeparatorType, NameOrderType } from '@archivo/shared';
import { DateUtils, StringUtils, SEPARATOR_OPTIONS, NAME_ORDER_OPTIONS } from '@archivo/shared';
import type { DateFormatPattern } from '@archivo/shared';

/**
 * Props for RenameConfigForm component
 */
export interface IRenameConfigFormProps {
  /**
   * Current configuration
   */
  config: IRenameConfig;

  /**
   * Callback when configuration changes
   */
  onConfigChange: (config: IRenameConfig) => void;

  /**
   * Whether the form is disabled
   */
  disabled?: boolean;
}

/**
 * RenameConfigForm component - form for configuring rename options
 */
export const RenameConfigForm: FC<IRenameConfigFormProps> = ({
  config,
  onConfigChange,
  disabled = false,
}) => {
  const theme = useTheme();

  /**
   * Validate the custom name field
   */
  const customNameValidation = useMemo(() => {
    return StringUtils.validateCustomName(config.customName);
  }, [config.customName]);

  /**
   * Handle source date format change
   */
  const handleSourceFormatChange = (value: DateFormatPattern) => {
    onConfigChange({
      ...config,
      sourceDateFormat: value,
    });
  };

  /**
   * Handle target date format change
   */
  const handleTargetFormatChange = (value: DateFormatPattern) => {
    onConfigChange({
      ...config,
      targetDateFormat: value,
    });
  };

  /**
   * Handle name order change
   */
  const handleNameOrderChange = (value: NameOrderType) => {
    onConfigChange({
      ...config,
      nameOrder: value,
    });
  };

  /**
   * Handle separator change
   */
  const handleSeparatorChange = (value: SeparatorType) => {
    onConfigChange({
      ...config,
      separator: value,
    });
  };

  /**
   * Handle custom name change
   */
  const handleCustomNameChange = (value: string) => {
    onConfigChange({
      ...config,
      customName: value,
    });
  };

  /**
   * Generate preview of the new filename format
   */
  const getPreview = (): string => {
    const today = new Date();
    const formattedDate = DateUtils.formatDate(today, config.targetDateFormat);
    // Only use custom name in preview if it's valid
    const sampleName =
      customNameValidation.isValid && config.customName?.trim()
        ? config.customName.trim()
        : 'example';
    const separator = config.separator;

    if (config.nameOrder === 'date-name') {
      return `${formattedDate}${separator}${sampleName}.ext`;
    } else {
      return `${sampleName}${separator}${formattedDate}.ext`;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" component="h3" fontWeight={600} gutterBottom>
        Rename Configuration
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure how filenames will be transformed. The date will be extracted from the original
        filename and reformatted.
      </Typography>

      <Grid container spacing={3}>
        {/* Source Date Format */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="source-format-label">Source Date Format</InputLabel>
            <Select
              labelId="source-format-label"
              value={config.sourceDateFormat}
              label="Source Date Format"
              onChange={(e) => handleSourceFormatChange(e.target.value as DateFormatPattern)}
            >
              {DateUtils.DATE_FORMATS.map((format) => (
                <MenuItem key={format.value} value={format.value}>
                  {format.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Target Date Format */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="target-format-label">Target Date Format</InputLabel>
            <Select
              labelId="target-format-label"
              value={config.targetDateFormat}
              label="Target Date Format"
              onChange={(e) => handleTargetFormatChange(e.target.value as DateFormatPattern)}
            >
              {DateUtils.DATE_FORMATS.map((format) => (
                <MenuItem key={format.value} value={format.value}>
                  {format.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Name Order */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="name-order-label">Name Order</InputLabel>
            <Select
              labelId="name-order-label"
              value={config.nameOrder}
              label="Name Order"
              onChange={(e) => handleNameOrderChange(e.target.value as NameOrderType)}
            >
              {NAME_ORDER_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Separator */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth disabled={disabled}>
            <InputLabel id="separator-label">Separator</InputLabel>
            <Select
              labelId="separator-label"
              value={config.separator}
              label="Separator"
              onChange={(e) => handleSeparatorChange(e.target.value as SeparatorType)}
            >
              {SEPARATOR_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Custom Name */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Custom Name (optional)"
            value={config.customName || ''}
            onChange={(e) => handleCustomNameChange(e.target.value)}
            disabled={disabled}
            placeholder="Leave empty to use extracted name from original filename"
            error={!customNameValidation.isValid}
            helperText={
              customNameValidation.isValid
                ? 'Only letters (a-z, A-Z), numbers (0-9), underscore (_), hyphen (-), and space are allowed'
                : customNameValidation.error
            }
            slotProps={{
              formHelperText: {
                sx: {
                  color: customNameValidation.isValid ? 'text.secondary' : 'error.main',
                },
              },
            }}
          />
        </Grid>
      </Grid>

      {/* Preview */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          backgroundColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
          Output Preview
        </Typography>
        <Typography
          variant="body1"
          fontFamily="monospace"
          sx={{ color: 'primary.main', fontWeight: 500 }}
        >
          {getPreview()}
        </Typography>
      </Box>
    </Paper>
  );
};
