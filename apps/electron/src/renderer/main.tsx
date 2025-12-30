/**
 * Electron Renderer Entry Point
 *
 * This file serves as a thin wrapper that imports the shared web application.
 * The actual application code lives in apps/web/src and is shared between platforms.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@archivo/ui';
import { router } from '@/router';

import '@/styles/global.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);
