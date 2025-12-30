import { type FC } from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@archivo/ui';
import { Header } from '@/components/Header';

/**
 * Root layout component that wraps all pages
 * Contains the header and main content area
 */
export const RootLayout: FC = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
