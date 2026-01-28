/**
 * Module-level base URL configuration for asset paths
 * Set this using configureAssetBasePath() before using getAssetPath()
 */
let configuredBasePath = '/';

/**
 * Configure the base path for asset URLs
 * Call this once during app initialization with import.meta.env.BASE_URL
 *
 * @param basePath - The base path (e.g., '/' or '/archivo/')
 *
 * @example
 * ```ts
 * // In your app's main.tsx
 * configureAssetBasePath(import.meta.env.BASE_URL);
 * ```
 */
export function configureAssetBasePath(basePath: string): void {
  configuredBasePath = basePath;
}

/**
 * Resolves asset paths for both web and Electron environments
 *
 * @param path - The asset path (e.g., '/favicon.svg')
 * @returns The resolved path suitable for the current environment
 *
 * @remarks
 * - In web environments (http/https), prepends the configured base URL for subdirectory deployment
 * - In Electron (file:// protocol), constructs a proper file:// URL relative to the HTML location
 * - Call configureAssetBasePath() with import.meta.env.BASE_URL during app initialization
 *
 * @example
 * ```ts
 * // In web with base '/': returns '/favicon.svg'
 * // In web with base '/archivo/': returns '/archivo/favicon.svg'
 * // In Electron: returns 'file:///path/to/app/favicon.svg'
 * const iconPath = getAssetPath('/favicon.svg');
 * ```
 */
export function getAssetPath(path: string): string {
  // Check if running in Electron (file:// protocol)
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    // Construct path relative to the HTML file location
    const htmlUrl = window.location.href;
    const url = new URL(path.replace(/^\//, ''), htmlUrl);
    return url.href;
  }

  // Web environment - prepend configured base URL
  const cleanPath = path.replace(/^\//, '');
  return `${configuredBasePath}${cleanPath}`;
}
