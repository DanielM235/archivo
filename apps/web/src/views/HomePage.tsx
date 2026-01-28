import { type FC } from 'react';
import { Box, Container, Typography, Card, CardContent, useMediaQuery, Grid } from '@archivo/ui';
import { useTheme as useMuiTheme, alpha } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { getAssetPath } from '@archivo/shared';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import TableChartIcon from '@mui/icons-material/TableChart';
import FolderZipIcon from '@mui/icons-material/FolderZip';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';
import { VersionLabel } from '../components';

/**
 * Feature card data interface
 */
interface IFeatureCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  comingSoon?: boolean;
  route?: string;
}

/**
 * Feature cards configuration
 */
const features: IFeatureCard[] = [
  {
    title: 'Bulk Rename',
    description: 'Rename multiple files at once using patterns, regex, or custom rules.',
    icon: <DriveFileRenameOutlineIcon sx={{ fontSize: 40 }} />,
    color: '#1976d2',
    route: '/rename',
  },
  {
    title: 'Contract Extract',
    description: 'Extract structured data from foreign exchange contract PDFs.',
    icon: <DescriptionIcon sx={{ fontSize: 40 }} />,
    color: '#00897b',
    route: '/contract-extract',
  },
  {
    title: 'Excel Merge',
    description: 'Merge multiple Excel files into a single file with one consolidated sheet.',
    icon: <TableChartIcon sx={{ fontSize: 40 }} />,
    color: '#9c27b0',
    route: '/excel-merge',
  },
  {
    title: 'Folder Processing',
    description: 'Process entire folder structures with recursive operations.',
    icon: <FolderZipIcon sx={{ fontSize: 40 }} />,
    color: '#2e7d32',
    comingSoon: true,
  },
  {
    title: 'Duplicate Files',
    description: 'Copy files to multiple destinations with custom naming.',
    icon: <ContentCopyIcon sx={{ fontSize: 40 }} />,
    color: '#ed6c02',
    comingSoon: true,
  },
  {
    title: 'Auto Rules',
    description: 'Create automated rules for file organization that run on schedule.',
    icon: <AutoFixHighIcon sx={{ fontSize: 40 }} />,
    color: '#0288d1',
    comingSoon: true,
  },
  {
    title: 'Settings',
    description: 'Configure application preferences and default behaviors.',
    icon: <SettingsIcon sx={{ fontSize: 40 }} />,
    color: '#616161',
    comingSoon: true,
  },
];

/**
 * Feature card component
 */
const FeatureCard: FC<{ feature: IFeatureCard; onNavigate?: (route: string) => void }> = ({
  feature,
  onNavigate,
}) => {
  const theme = useMuiTheme();
  const isClickable = !!feature.route && !feature.comingSoon;

  const handleClick = () => {
    if (isClickable && feature.route && onNavigate) {
      onNavigate(feature.route);
    }
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease-in-out',
        cursor: isClickable ? 'pointer' : 'default',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          transform: isClickable ? 'translateY(-4px)' : 'none',
          boxShadow: isClickable ? theme.shadows[8] : undefined,
        },
      }}
    >
      {feature.comingSoon && (
        <Box
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            backgroundColor: 'secondary.main',
            color: 'secondary.contrastText',
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            fontSize: '0.75rem',
            fontWeight: 600,
            boxShadow: 2,
          }}
        >
          Coming Soon
        </Box>
      )}
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: alpha(feature.color, 0.1),
            color: feature.color,
            mb: 2,
          }}
        >
          {feature.icon}
        </Box>
        <Typography variant="h6" component="h3" gutterBottom fontWeight={600}>
          {feature.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {feature.description}
        </Typography>
      </CardContent>
    </Card>
  );
};

/**
 * Home page component
 * Landing page with feature overview
 */
export const HomePage: FC = () => {
  const theme = useMuiTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleNavigate = (route: string) => {
    navigate(route);
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        py: { xs: 3, sm: 4, md: 5 },
      }}
    >
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box
          sx={{
            textAlign: 'center',
            mb: { xs: 4, md: 5 },
          }}
        >
          {/* Animated App Icon */}
          <Box
            sx={{
              mb: 3,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <Box
              component="img"
              src={getAssetPath('/archivo-icon-animated.svg')}
              alt="Archivo"
              sx={{
                width: { xs: 100, sm: 120, md: 140 },
                height: { xs: 100, sm: 120, md: 140 },
                filter: 'drop-shadow(0 8px 24px rgba(25, 118, 210, 0.3))',
                transition: 'transform 0.3s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.05)',
                },
              }}
            />
          </Box>
          <Typography
            variant={isMobile ? 'h4' : 'h3'}
            component="h2"
            gutterBottom
            fontWeight={700}
            sx={{
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Bulk File Operations Made Easy
          </Typography>
          <Typography
            variant={isMobile ? 'body1' : 'h6'}
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Rename, move, and organize thousands of files in seconds. Powerful pattern matching and
            automation at your fingertips.
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={3}>
          {features.map((feature) => (
            <Grid key={feature.title} size={{ xs: 12, sm: 6, md: 4 }}>
              <FeatureCard feature={feature} onNavigate={handleNavigate} />
            </Grid>
          ))}
        </Grid>

        {/* Version Label */}
        <Box
          sx={{
            mt: 4,
            textAlign: 'center',
          }}
        >
          <VersionLabel />
        </Box>
      </Container>
    </Box>
  );
};
