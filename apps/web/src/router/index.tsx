import { createBrowserRouter, createHashRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/views/HomePage';
import { NotFoundPage } from '@/views/NotFoundPage';
import { RenamePage } from '@/views/RenamePage';
import { ContractExtractPage } from '@/views/ContractExtractPage';

/**
 * Application routes configuration
 */
const routes: RouteObject[] = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'rename',
        element: <RenamePage />,
      },
      {
        path: 'contract-extract',
        element: <ContractExtractPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];

/**
 * Router instance
 * Uses HashRouter for Electron (file:// protocol) and BrowserRouter for web
 * The basename is derived from Vite's base URL configuration
 */
const basename = import.meta.env.BASE_URL;

export const router =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? createHashRouter(routes)
    : createBrowserRouter(routes, { basename });
