import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@archivo/ui';
import SearchOffIcon from '@mui/icons-material/SearchOff';

/**
 * 404 Not Found page component
 */
export const NotFoundPage: FC = () => {
  return (
    <Box
      sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            textAlign: 'center',
          }}
        >
          <SearchOffIcon
            sx={{
              fontSize: 120,
              color: 'text.secondary',
              opacity: 0.5,
              mb: 2,
            }}
          />
          <Typography variant="h3" component="h1" gutterBottom fontWeight={700}>
            404
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            The page you are looking for does not exist or has been moved.
          </Typography>
          <Button component={Link} to="/" variant="contained" size="large" sx={{ px: 4 }}>
            Go Home
          </Button>
        </Box>
      </Container>
    </Box>
  );
};
