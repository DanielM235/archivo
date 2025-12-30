import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { HomePage } from '@/views/HomePage';
import { NotFoundPage } from '@/views/NotFoundPage';

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
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
];

/**
 * Browser router instance for the web application
 */
export const router = createBrowserRouter(routes);
