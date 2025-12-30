import { type FC } from 'react';
import { Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

/**
 * Props for the VersionLabel component
 */
interface IVersionLabelProps {
  /**
   * Optional custom version string. If not provided, uses __APP_VERSION__
   */
  version?: string;
}

/**
 * Discrete version label component for displaying app version
 * Designed to be placed at the bottom of pages with theme-aware styling
 */
export const VersionLabel: FC<IVersionLabelProps> = ({ version }) => {
  const theme = useTheme();
  const displayVersion = version ?? __APP_VERSION__;

  return (
    <Typography
      variant="caption"
      component="span"
      sx={{
        color: alpha(theme.palette.text.secondary, 0.5),
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        letterSpacing: '0.05em',
        transition: 'color 0.2s ease-in-out',
        userSelect: 'none',
        '&:hover': {
          color: alpha(theme.palette.text.secondary, 0.8),
        },
      }}
    >
      v{displayVersion}
    </Typography>
  );
};
