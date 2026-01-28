import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ZipUtils, type IZipAdapter, type IZipEntry } from './zip.utils';

describe('ZipUtils', () => {
  // ============================================
  // Adapter Management
  // ============================================
  describe('adapter management', () => {
    beforeEach(() => {
      // Reset adapter before each test
      ZipUtils.setAdapter(null as unknown as IZipAdapter);
    });

    afterEach(() => {
      // Clean up adapter after tests
      ZipUtils.setAdapter(null as unknown as IZipAdapter);
    });

    it('should throw error when adapter is not set', () => {
      expect(() => ZipUtils.getAdapter()).toThrow(
        'Zip adapter not initialized. Call ZipUtils.setAdapter() first.'
      );
    });

    it('should return false when adapter is not set', () => {
      expect(ZipUtils.hasAdapter()).toBe(false);
    });

    it('should set and get adapter correctly', () => {
      const mockAdapter: IZipAdapter = {
        readZipEntries: vi.fn(),
        extractEntry: vi.fn(),
        createZip: vi.fn(),
      };

      ZipUtils.setAdapter(mockAdapter);
      expect(ZipUtils.hasAdapter()).toBe(true);
      expect(ZipUtils.getAdapter()).toBe(mockAdapter);
    });
  });

  // ============================================
  // entriesToFileInfo
  // ============================================
  describe('entriesToFileInfo', () => {
    it('should convert zip entries to file info', () => {
      const entries: IZipEntry[] = [
        { name: 'document.pdf', isDirectory: false, size: 1024, compressedSize: 512 },
        { name: 'image.jpg', isDirectory: false, size: 2048, compressedSize: 1024 },
      ];

      const result = ZipUtils.entriesToFileInfo(entries);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        originalName: 'document.pdf',
        originalPath: 'document.pdf',
        extension: 'pdf',
        size: 1024,
        nameWithoutExtension: 'document',
        newName: null,
      });
      expect(result[0]?.id).toBeDefined();
    });

    it('should filter out directories', () => {
      const entries: IZipEntry[] = [
        { name: 'folder/', isDirectory: true, size: 0, compressedSize: 0 },
        { name: 'folder/file.txt', isDirectory: false, size: 100, compressedSize: 50 },
      ];

      const result = ZipUtils.entriesToFileInfo(entries);

      expect(result).toHaveLength(1);
      expect(result[0]?.originalName).toBe('file.txt');
    });

    it('should handle nested paths', () => {
      const entries: IZipEntry[] = [
        {
          name: 'folder/subfolder/document.pdf',
          isDirectory: false,
          size: 1024,
          compressedSize: 512,
        },
      ];

      const result = ZipUtils.entriesToFileInfo(entries);

      expect(result[0]).toMatchObject({
        originalName: 'document.pdf',
        originalPath: 'folder/subfolder/document.pdf',
        extension: 'pdf',
        nameWithoutExtension: 'document',
      });
    });

    it('should handle files without extension', () => {
      const entries: IZipEntry[] = [
        { name: 'README', isDirectory: false, size: 100, compressedSize: 50 },
      ];

      const result = ZipUtils.entriesToFileInfo(entries);

      expect(result[0]).toMatchObject({
        originalName: 'README',
        extension: '',
        nameWithoutExtension: 'README',
      });
    });

    it('should filter out empty filenames', () => {
      const entries: IZipEntry[] = [
        { name: '', isDirectory: false, size: 0, compressedSize: 0 },
        { name: 'file.txt', isDirectory: false, size: 100, compressedSize: 50 },
      ];

      const result = ZipUtils.entriesToFileInfo(entries);

      expect(result).toHaveLength(1);
      expect(result[0]?.originalName).toBe('file.txt');
    });

    it('should convert extension to lowercase', () => {
      const entries: IZipEntry[] = [
        { name: 'Document.PDF', isDirectory: false, size: 1024, compressedSize: 512 },
      ];

      const result = ZipUtils.entriesToFileInfo(entries);

      expect(result[0]?.extension).toBe('pdf');
    });

    it('should return empty array for empty input', () => {
      const result = ZipUtils.entriesToFileInfo([]);
      expect(result).toHaveLength(0);
    });
  });

  // ============================================
  // triggerDownload
  // ============================================
  // Note: triggerDownload uses DOM APIs (document.createElement, etc.)
  // These are tested in browser/jsdom environments in apps/web
  // The function is simple and calls DOM methods directly

  // ============================================
  // getOutputFilename
  // ============================================
  describe('getOutputFilename', () => {
    it('should append _renamed to filename', () => {
      expect(ZipUtils.getOutputFilename('archive.zip')).toBe('archive_renamed.zip');
    });

    it('should handle filename without extension', () => {
      expect(ZipUtils.getOutputFilename('archive')).toBe('archive_renamed.zip');
    });

    it('should handle multiple dots in filename', () => {
      expect(ZipUtils.getOutputFilename('my.archive.file.zip')).toBe('my.archive.file_renamed.zip');
    });

    it('should handle dot-prefixed filename', () => {
      // .zip is treated as basename with empty extension
      expect(ZipUtils.getOutputFilename('.zip')).toBe('.zip_renamed.zip');
    });
  });
});
