import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebZipAdapter, getWebZipAdapter } from './WebZipAdapter';

// Create mock for JSZip
const mockZipInstance = {
  loadAsync: vi.fn(),
  file: vi.fn(),
  generateAsync: vi.fn(),
};

// Mock the default export as a class
vi.mock('jszip', () => {
  // Return a constructor function that returns our mock instance
  const MockJSZip = function (this: typeof mockZipInstance) {
    Object.assign(this, mockZipInstance);
    return this;
  };

  return {
    default: MockJSZip,
  };
});

describe('WebZipAdapter', () => {
  let adapter: WebZipAdapter;

  beforeEach(() => {
    adapter = new WebZipAdapter();
    vi.clearAllMocks();
  });

  describe('readZipEntries', () => {
    it('should throw error when passed a string path', async () => {
      await expect(adapter.readZipEntries('/path/to/file.zip')).rejects.toThrow(
        'WebZipAdapter does not support path strings. Use File object.'
      );
    });

    it('should read entries from a zip file', async () => {
      const mockFile = new File(['content'], 'test.zip', { type: 'application/zip' });

      const mockEntries: Array<
        [string, { dir: boolean; _data?: { uncompressedSize?: number; compressedSize?: number } }]
      > = [
        ['file1.txt', { dir: false, _data: { uncompressedSize: 100, compressedSize: 50 } }],
        ['folder/', { dir: true, _data: {} }],
        ['file2.jpg', { dir: false, _data: {} }],
      ];

      const loadedZip = {
        forEach: vi.fn(
          (callback: (path: string, entry: { dir: boolean; _data?: object }) => void) => {
            mockEntries.forEach(([path, entry]) => callback(path, entry));
          }
        ),
      };

      mockZipInstance.loadAsync.mockResolvedValue(loadedZip);

      const entries = await adapter.readZipEntries(mockFile);

      expect(entries).toHaveLength(3);
      expect(entries[0]).toEqual({
        name: 'file1.txt',
        isDirectory: false,
        size: 100,
        compressedSize: 50,
      });
      expect(entries[1]).toEqual({
        name: 'folder/',
        isDirectory: true,
        size: 0,
        compressedSize: 0,
      });
      expect(entries[2]).toEqual({
        name: 'file2.jpg',
        isDirectory: false,
        size: 0,
        compressedSize: 0,
      });
    });

    it('should handle empty zip file', async () => {
      const mockFile = new File([''], 'empty.zip', { type: 'application/zip' });

      const loadedZip = {
        forEach: vi.fn(),
      };

      mockZipInstance.loadAsync.mockResolvedValue(loadedZip);

      const entries = await adapter.readZipEntries(mockFile);

      expect(entries).toHaveLength(0);
    });
  });

  describe('extractEntry', () => {
    it('should throw error when passed a string path', async () => {
      await expect(adapter.extractEntry('/path/to/file.zip', 'file.txt')).rejects.toThrow(
        'WebZipAdapter does not support path strings. Use File object.'
      );
    });

    it('should extract entry from zip file', async () => {
      const mockFile = new File(['content'], 'test.zip', { type: 'application/zip' });
      const expectedBuffer = new ArrayBuffer(8);

      const mockEntry = {
        async: vi.fn().mockResolvedValue(expectedBuffer),
      };

      const loadedZip = {
        file: vi.fn().mockReturnValue(mockEntry),
      };

      mockZipInstance.loadAsync.mockResolvedValue(loadedZip);

      const result = await adapter.extractEntry(mockFile, 'file.txt');

      expect(loadedZip.file).toHaveBeenCalledWith('file.txt');
      expect(mockEntry.async).toHaveBeenCalledWith('arraybuffer');
      expect(result).toBe(expectedBuffer);
    });

    it('should throw error when entry not found', async () => {
      const mockFile = new File(['content'], 'test.zip', { type: 'application/zip' });

      const loadedZip = {
        file: vi.fn().mockReturnValue(null),
      };

      mockZipInstance.loadAsync.mockResolvedValue(loadedZip);

      await expect(adapter.extractEntry(mockFile, 'nonexistent.txt')).rejects.toThrow(
        'Entry not found: nonexistent.txt'
      );
    });
  });

  describe('createZip', () => {
    it('should create a zip file from entries', async () => {
      const entries = [
        { name: 'file1.txt', data: new ArrayBuffer(10) },
        { name: 'file2.txt', data: new Uint8Array([1, 2, 3]) },
      ];

      const expectedBlob = new Blob(['mock zip content']);
      mockZipInstance.file.mockReturnValue(mockZipInstance);
      mockZipInstance.generateAsync.mockResolvedValue(expectedBlob);

      const result = await adapter.createZip(entries);

      expect(mockZipInstance.file).toHaveBeenCalledTimes(2);
      expect(mockZipInstance.file).toHaveBeenCalledWith('file1.txt', entries[0].data);
      expect(mockZipInstance.file).toHaveBeenCalledWith('file2.txt', entries[1].data);
      expect(mockZipInstance.generateAsync).toHaveBeenCalledWith({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        streamFiles: true,
      });
      expect(result).toBe(expectedBlob);
    });

    it('should create an empty zip file', async () => {
      const entries: { name: string; data: ArrayBuffer }[] = [];
      const expectedBlob = new Blob(['empty zip']);

      mockZipInstance.generateAsync.mockResolvedValue(expectedBlob);

      const result = await adapter.createZip(entries);

      expect(mockZipInstance.file).not.toHaveBeenCalled();
      expect(result).toBe(expectedBlob);
    });
  });
});

describe('getWebZipAdapter', () => {
  it('should return a WebZipAdapter instance', () => {
    const adapter = getWebZipAdapter();
    expect(adapter).toBeInstanceOf(WebZipAdapter);
  });

  it('should return the same instance on subsequent calls', () => {
    const adapter1 = getWebZipAdapter();
    const adapter2 = getWebZipAdapter();
    expect(adapter1).toBe(adapter2);
  });
});
