import { describe, it, expect, vi } from 'vitest';
import { RenameService } from './RenameService';
import type { IRenameConfig, IRenameFileInfo } from '../interfaces/IRenameConfig';

describe('RenameService', () => {
  // Helper to create a mock file info
  const createMockFileInfo = (
    originalName: string,
    overrides: Partial<IRenameFileInfo> = {}
  ): IRenameFileInfo => ({
    id: '1',
    originalName,
    originalPath: originalName,
    extension: originalName.split('.').pop() || '',
    size: 1024,
    nameWithoutExtension: originalName.replace(/\.[^.]+$/, ''),
    newName: null,
    ...overrides,
  });

  // Default config for testing
  const defaultConfig: IRenameConfig = {
    sourceDateFormat: 'YYYYMMDD',
    targetDateFormat: 'YYMMDD',
    nameOrder: 'date-name',
    separator: '_',
  };

  // ============================================
  // validateConfig
  // ============================================
  describe('validateConfig', () => {
    it('should return valid for default config', () => {
      const result = RenameService.validateConfig(defaultConfig);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for config without custom name', () => {
      const result = RenameService.validateConfig({
        ...defaultConfig,
        customName: undefined,
      });
      expect(result.isValid).toBe(true);
    });

    it('should return valid for config with empty custom name', () => {
      const result = RenameService.validateConfig({
        ...defaultConfig,
        customName: '',
      });
      expect(result.isValid).toBe(true);
    });

    it('should return valid for config with valid custom name', () => {
      const result = RenameService.validateConfig({
        ...defaultConfig,
        customName: 'MyDocument',
      });
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for config with invalid custom name', () => {
      const result = RenameService.validateConfig({
        ...defaultConfig,
        customName: 'Invalid@Name',
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid custom name');
    });

    it('should return invalid for custom name with special characters', () => {
      const result = RenameService.validateConfig({
        ...defaultConfig,
        customName: 'file.name',
      });
      expect(result.isValid).toBe(false);
    });
  });

  // ============================================
  // generateNewFilename
  // ============================================
  describe('generateNewFilename', () => {
    it('should generate filename with date-name order', () => {
      const file = createMockFileInfo('document.pdf', {
        extractedDate: new Date(2025, 11, 30),
        extractedName: 'document',
      });

      const result = RenameService.generateNewFilename(file, {
        ...defaultConfig,
        nameOrder: 'date-name',
      });

      expect(result).toBe('251230_document.pdf');
    });

    it('should generate filename with name-date order', () => {
      const file = createMockFileInfo('document.pdf', {
        extractedDate: new Date(2025, 11, 30),
        extractedName: 'document',
      });

      const result = RenameService.generateNewFilename(file, {
        ...defaultConfig,
        nameOrder: 'name-date',
      });

      expect(result).toBe('document_251230.pdf');
    });

    it('should use custom name when provided', () => {
      const file = createMockFileInfo('old_document.pdf', {
        extractedDate: new Date(2025, 11, 30),
        extractedName: 'old_document',
      });

      const result = RenameService.generateNewFilename(file, {
        ...defaultConfig,
        customName: 'NewName',
      });

      expect(result).toBe('251230_NewName.pdf');
    });

    it('should not use invalid custom name', () => {
      const file = createMockFileInfo('document.pdf', {
        extractedDate: new Date(2025, 11, 30),
        extractedName: 'document',
      });

      const result = RenameService.generateNewFilename(file, {
        ...defaultConfig,
        customName: 'Invalid@Name',
      });

      // Should fall back to extracted name
      expect(result).toBe('251230_document.pdf');
    });

    it('should use different separators', () => {
      const file = createMockFileInfo('document.pdf', {
        extractedDate: new Date(2025, 11, 30),
        extractedName: 'document',
      });

      expect(
        RenameService.generateNewFilename(file, {
          ...defaultConfig,
          separator: '-',
        })
      ).toBe('251230-document.pdf');

      expect(
        RenameService.generateNewFilename(file, {
          ...defaultConfig,
          separator: ' ',
        })
      ).toBe('251230 document.pdf');

      expect(
        RenameService.generateNewFilename(file, {
          ...defaultConfig,
          separator: '',
        })
      ).toBe('251230document.pdf');
    });

    it('should format date according to target format', () => {
      const file = createMockFileInfo('document.pdf', {
        extractedDate: new Date(2025, 11, 30),
        extractedName: 'document',
      });

      const result = RenameService.generateNewFilename(file, {
        ...defaultConfig,
        targetDateFormat: 'YYYY-MM-DD',
      });

      expect(result).toBe('2025-12-30_document.pdf');
    });

    it('should fallback to today if no extracted date', () => {
      const file = createMockFileInfo('document.pdf', {
        extractedDate: null,
        extractedName: 'document',
      });

      const result = RenameService.generateNewFilename(file, defaultConfig);

      // Should contain today's date in YYMMDD format
      const today = new Date();
      const yy = String(today.getFullYear()).slice(-2);
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');

      expect(result).toBe(`${yy}${mm}${dd}_document.pdf`);
    });
  });

  // ============================================
  // previewRename
  // ============================================
  describe('previewRename', () => {
    it('should generate new names for all files', () => {
      const files = [
        createMockFileInfo('20251230_doc1.pdf'),
        createMockFileInfo('20251225_doc2.pdf'),
      ];

      const result = RenameService.previewRename(files, defaultConfig);

      expect(result).toHaveLength(2);
      expect(result[0]?.newName).toBe('251230_doc1.pdf');
      expect(result[1]?.newName).toBe('251225_doc2.pdf');
    });

    it('should handle files without dates', () => {
      const files = [createMockFileInfo('document.pdf')];

      const result = RenameService.previewRename(files, defaultConfig);

      expect(result).toHaveLength(1);
      // Should use today's date
      expect(result[0]?.newName).toMatch(/^\d{6}_document\.pdf$/);
    });

    it('should generate unique filenames', () => {
      const files = [
        createMockFileInfo('20251230_doc.pdf'),
        createMockFileInfo('20251230_doc.pdf', { id: '2' }),
      ];

      const result = RenameService.previewRename(files, defaultConfig);

      expect(result[0]?.newName).toBe('251230_doc.pdf');
      expect(result[1]?.newName).toBe('251230_doc (1).pdf');
    });

    it('should return error for all files if config is invalid', () => {
      const files = [
        createMockFileInfo('20251230_doc1.pdf'),
        createMockFileInfo('20251230_doc2.pdf'),
      ];

      const result = RenameService.previewRename(files, {
        ...defaultConfig,
        customName: 'Invalid@Name',
      });

      expect(result).toHaveLength(2);
      expect(result[0]?.newName).toBeNull();
      expect(result[0]?.error).toContain('Invalid custom name');
      expect(result[1]?.newName).toBeNull();
      expect(result[1]?.error).toContain('Invalid custom name');
    });

    it('should extract date and remaining name', () => {
      const files = [createMockFileInfo('20251230_my_document.pdf')];

      const result = RenameService.previewRename(files, defaultConfig);

      expect(result[0]?.extractedDate).toBeInstanceOf(Date);
      expect(result[0]?.extractedDate?.getFullYear()).toBe(2025);
      expect(result[0]?.extractedName).toBe('my_document');
    });

    it('should apply custom name to all files', () => {
      const files = [
        createMockFileInfo('20251230_doc1.pdf'),
        createMockFileInfo('20251225_doc2.pdf'),
      ];

      const result = RenameService.previewRename(files, {
        ...defaultConfig,
        customName: 'Report',
      });

      expect(result[0]?.newName).toBe('251230_Report.pdf');
      expect(result[1]?.newName).toBe('251225_Report.pdf');
    });

    it('should return error when validation fails', () => {
      const files = [createMockFileInfo('20251230_doc.pdf')];

      const result = RenameService.previewRename(files, {
        ...defaultConfig,
        customName: 'Invalid@Name!',
      });

      expect(result[0]?.error).toBeDefined();
      expect(result[0]?.newName).toBeNull();
    });

    it('should handle files without dates', () => {
      const files = [createMockFileInfo('document.pdf')];

      const result = RenameService.previewRename(files, defaultConfig);

      // Should use original name when no date is extracted
      expect(result[0]?.newName).toBeDefined();
    });

    it('should ensure unique filenames', () => {
      const files = [
        createMockFileInfo('20251230_doc.pdf'),
        createMockFileInfo('20251230_doc.pdf'),
      ];

      const result = RenameService.previewRename(files, defaultConfig);

      // Second file should have a unique name
      expect(result[0]?.newName).not.toBe(result[1]?.newName);
    });

    it('should handle error during file processing', () => {
      const files = [
        {
          ...createMockFileInfo('20251230_doc.pdf'),
          extension: undefined as unknown as string, // This will cause an error
        },
      ];

      // Should not throw, but handle gracefully
      const result = RenameService.previewRename(files, defaultConfig);
      expect(result).toBeDefined();
    });

    it('should generate unique names when duplicates exist', () => {
      const files = [
        createMockFileInfo('20251230_doc.pdf'),
        createMockFileInfo('20251230_doc.pdf'),
        createMockFileInfo('20251230_doc.pdf'),
      ];

      const result = RenameService.previewRename(files, defaultConfig);

      // All files should have unique names
      const names = result.map((r) => r.newName);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(3);
    });
  });

  // ============================================
  // executeRename
  // ============================================
  describe('executeRename', () => {
    it('should execute rename operation successfully', async () => {
      const mockAdapter = {
        readZipEntries: vi.fn(),
        extractEntry: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
        createZip: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' })),
      };

      // Set up the adapter
      const { ZipUtils } = await import('../utils/zip.utils');
      ZipUtils.setAdapter(mockAdapter);

      const files = [
        { ...createMockFileInfo('doc1.pdf'), newName: 'renamed1.pdf' },
        { ...createMockFileInfo('doc2.pdf'), newName: 'renamed2.pdf' },
      ];

      const result = await RenameService.executeRename(new File([], 'test.zip'), files);

      expect(result.success).toBe(true);
      expect(result.renamedCount).toBe(2);
      expect(result.errorCount).toBe(0);
      expect(result.outputBlob).toBeDefined();
    });

    it('should count errors for files without newName', async () => {
      const mockAdapter = {
        readZipEntries: vi.fn(),
        extractEntry: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
        createZip: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' })),
      };

      const { ZipUtils } = await import('../utils/zip.utils');
      ZipUtils.setAdapter(mockAdapter);

      const files = [
        { ...createMockFileInfo('doc1.pdf'), newName: 'renamed1.pdf' },
        { ...createMockFileInfo('doc2.pdf'), newName: null },
      ];

      const result = await RenameService.executeRename(new File([], 'test.zip'), files);

      expect(result.renamedCount).toBe(1);
      expect(result.errorCount).toBe(1);
    });

    it('should handle extraction errors', async () => {
      const mockAdapter = {
        readZipEntries: vi.fn(),
        extractEntry: vi.fn().mockRejectedValue(new Error('Extraction failed')),
        createZip: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' })),
      };

      const { ZipUtils } = await import('../utils/zip.utils');
      ZipUtils.setAdapter(mockAdapter);

      const files = [{ ...createMockFileInfo('doc1.pdf'), newName: 'renamed1.pdf' }];

      const result = await RenameService.executeRename(new File([], 'test.zip'), files);

      expect(result.errorCount).toBe(1);
    });

    it('should handle createZip failure', async () => {
      const mockAdapter = {
        readZipEntries: vi.fn(),
        extractEntry: vi.fn().mockResolvedValue(new ArrayBuffer(100)),
        createZip: vi.fn().mockRejectedValue(new Error('Create zip failed')),
      };

      const { ZipUtils } = await import('../utils/zip.utils');
      ZipUtils.setAdapter(mockAdapter);

      const files = [{ ...createMockFileInfo('doc1.pdf'), newName: 'renamed1.pdf' }];

      const result = await RenameService.executeRename(new File([], 'test.zip'), files);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  // ============================================
  // processZipFile
  // ============================================
  describe('processZipFile', () => {
    it('should process zip file and return file info', async () => {
      const mockEntries = [
        { name: 'doc1.pdf', isDirectory: false, size: 1024, compressedSize: 512 },
        { name: 'doc2.pdf', isDirectory: false, size: 2048, compressedSize: 1024 },
      ];

      const mockAdapter = {
        readZipEntries: vi.fn().mockResolvedValue(mockEntries),
        extractEntry: vi.fn(),
        createZip: vi.fn(),
      };

      const { ZipUtils } = await import('../utils/zip.utils');
      ZipUtils.setAdapter(mockAdapter);

      const result = await RenameService.processZipFile(new File([], 'test.zip'));

      expect(result).toHaveLength(2);
      expect(result[0]?.originalName).toBe('doc1.pdf');
    });
  });

  // ============================================
  // processFolder
  // ============================================
  describe('processFolder', () => {
    it('should process file handles and return file info', async () => {
      const mockFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(mockFile, 'size', { value: 1024 });

      const mockHandle = {
        getFile: vi.fn().mockResolvedValue(mockFile),
      } as unknown as FileSystemFileHandle;

      const result = await RenameService.processFolder([mockHandle]);

      expect(result).toHaveLength(1);
      expect(result[0]?.originalName).toBe('document.pdf');
      expect(result[0]?.extension).toBe('pdf');
    });

    it('should handle errors gracefully', async () => {
      const mockHandle = {
        getFile: vi.fn().mockRejectedValue(new Error('Access denied')),
      } as unknown as FileSystemFileHandle;

      const result = await RenameService.processFolder([mockHandle]);

      expect(result).toHaveLength(0);
    });

    it('should process multiple file handles', async () => {
      const mockFile1 = new File(['content1'], 'doc1.pdf');
      const mockFile2 = new File(['content2'], 'doc2.txt');

      const mockHandles = [
        { getFile: vi.fn().mockResolvedValue(mockFile1) },
        { getFile: vi.fn().mockResolvedValue(mockFile2) },
      ] as unknown as FileSystemFileHandle[];

      const result = await RenameService.processFolder(mockHandles);

      expect(result).toHaveLength(2);
      expect(result[0]?.originalName).toBe('doc1.pdf');
      expect(result[1]?.originalName).toBe('doc2.txt');
    });
  });
});
