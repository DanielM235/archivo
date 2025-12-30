/**
 * Resolves asset paths for both web and Electron environments
 *
 * @param path - The asset path (e.g., '/favicon.svg')
 * @returns The resolved path suitable for the current environment
 *
 * @remarks
 * - In web environments (http/https), returns the path as-is
 * - In Electron (file:// protocol), constructs a proper file:// URL relative to the HTML location
 *
 * @example
 * ```ts
 * // In web: returns '/favicon.svg'
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

  // Web environment - return path as-is
  return path;
}
