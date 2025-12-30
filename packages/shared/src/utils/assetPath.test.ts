import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getAssetPath } from './assetPath';

describe('getAssetPath', () => {
  const originalWindow = global.window;

  beforeEach(() => {
    // Setup window mock if it doesn't exist
    if (!global.window) {
      (global as any).window = {};
    }
  });

  afterEach(() => {
    // Restore original window
    if (originalWindow) {
      global.window = originalWindow;
    } else {
      delete (global as any).window;
    }
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

    it('should return the path as-is for http protocol', () => {
      expect(getAssetPath('/favicon.svg')).toBe('/favicon.svg');
    });

    it('should return the path as-is for paths without leading slash', () => {
      expect(getAssetPath('assets/icon.png')).toBe('assets/icon.png');
    });

    it('should return the path as-is for absolute URLs', () => {
      expect(getAssetPath('/images/logo.svg')).toBe('/images/logo.svg');
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
    });

    it('should handle empty string', () => {
      expect(getAssetPath('')).toBe('');
    });

    it('should handle paths with special characters', () => {
      expect(getAssetPath('/assets/icon%20file.svg')).toBe('/assets/icon%20file.svg');
    });
  });
});
