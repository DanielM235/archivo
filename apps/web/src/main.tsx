import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@archivo/ui';
import { configureAssetBasePath } from '@archivo/shared';
import { router } from './router';

import './styles/global.scss';

// Configure asset paths for subdirectory deployment
configureAssetBasePath(import.meta.env.BASE_URL);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
