/**
 * Electron Renderer Entry Point
 *
 * This file serves as a thin wrapper that imports the shared web application.
 * The actual application code lives in apps/web/src and is shared between platforms.
 */

// Import and re-export the web app entry point
// This allows Electron to use the exact same React application as the web version
import '../../../../apps/web/src/main.tsx';
