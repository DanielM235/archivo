import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAssetPath, configureAssetBasePath } from './assetPath';

describe('getAssetPath', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Setup window mock if it doesn't exist
    if (!global.window) {
      (global as any).window = {};
    }
    // Reset to default base path
    configureAssetBasePath('/');
  });

  afterEach(() => {
    // Restore original window
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      delete (global as any).window;
    }
  });

  describe('configureAssetBasePath', () => {
    beforeEach(() => {
      (global as any).window = {
        location: {
          protocol: 'http:',
          href: 'http://localhost:3000/index.html',
        },
      };
    });

    it('should configure base path for subsequent calls', () => {
      configureAssetBasePath('/myapp/');
      expect(getAssetPath('/favicon.svg')).toBe('/myapp/favicon.svg');
    });

    it('should work with nested paths', () => {
      configureAssetBasePath('/apps/archivo/');
      expect(getAssetPath('/images/logo.svg')).toBe('/apps/archivo/images/logo.svg');
    });
  });

  describe('Web environment (http/https)', () => {
    beforeEach(() => {
      // Mock web environment
      (global as any).window = {
        location: {
          protocol: 'http:',
          href: 'http://localhost:3000/index.html',
        },
      };
    });

    it('should prepend base path when set to root', () => {
      configureAssetBasePath('/');
      expect(getAssetPath('/favicon.svg')).toBe('/favicon.svg');
    });

    it('should prepend base path when set to subdirectory', () => {
      configureAssetBasePath('/archivo/');
      expect(getAssetPath('/favicon.svg')).toBe('/archivo/favicon.svg');
    });

    it('should handle paths without leading slash with subdirectory base', () => {
      configureAssetBasePath('/archivo/');
      expect(getAssetPath('assets/icon.png')).toBe('/archivo/assets/icon.png');
    });

    it('should handle nested subdirectory in base path', () => {
      configureAssetBasePath('/apps/archivo/');
      expect(getAssetPath('/images/logo.svg')).toBe('/apps/archivo/images/logo.svg');
    });
  });

  describe('Electron environment (file://)', () => {
    beforeEach(() => {
      // Mock Electron environment
      (global as any).window = {
        location: {
          protocol: 'file:',
          href: 'file:///opt/Archivo/resources/app/dist/renderer/index.html',
        },
      };
    });

    it('should resolve path relative to HTML file location', () => {
      const result = getAssetPath('/favicon.svg');
      expect(result).toBe('file:///opt/Archivo/resources/app/dist/renderer/favicon.svg');
    });

    it('should handle paths with leading slash', () => {
      const result = getAssetPath('/images/icon.png');
      expect(result).toBe('file:///opt/Archivo/resources/app/dist/renderer/images/icon.png');
    });

    it('should handle paths without leading slash', () => {
      const result = getAssetPath('favicon.svg');
      expect(result).toBe('file:///opt/Archivo/resources/app/dist/renderer/favicon.svg');
    });

    it('should resolve nested paths correctly', () => {
      const result = getAssetPath('/assets/images/logo.svg');
      expect(result).toBe('file:///opt/Archivo/resources/app/dist/renderer/assets/images/logo.svg');
    });
  });

  describe('Edge cases', () => {
    beforeEach(() => {
      // Mock web environment
      (global as any).window = {
        location: {
          protocol: 'https:',
          href: 'https://example.com/app/index.html',
        },
      };
      configureAssetBasePath('/');
    });

    it('should handle empty string', () => {
      expect(getAssetPath('')).toBe('/');
    });

    it('should handle paths with special characters', () => {
      expect(getAssetPath('/assets/icon%20file.svg')).toBe('/assets/icon%20file.svg');
    });
  });
});
