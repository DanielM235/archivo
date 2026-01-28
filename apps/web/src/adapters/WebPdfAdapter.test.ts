import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebPdfAdapter, getWebPdfAdapter } from './WebPdfAdapter';
import * as pdfjsLib from 'pdfjs-dist';

// Mock pdfjs-dist
vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: vi.fn(),
}));

/**
 * Create a mock File that properly passes instanceof checks
 */
function createMockFile(
  content: ArrayBuffer,
  name: string,
  type: string = 'application/pdf'
): File {
  const blob = new Blob([content], { type });
  const file = new File([blob], name, { type });
  // Define arrayBuffer method since jsdom doesn't fully support it
  file.arrayBuffer = vi.fn().mockResolvedValue(content);
  return file;
}

describe('WebPdfAdapter', () => {
  let adapter: WebPdfAdapter;
  let mockPdf: any;
  let mockPage: any;

  beforeEach(() => {
    adapter = new WebPdfAdapter();

    // Setup mock page
    mockPage = {
      getTextContent: vi.fn(),
    };

    // Setup mock PDF document
    mockPdf = {
      numPages: 2,
      getPage: vi.fn(),
    };

    vi.clearAllMocks();
  });

  describe('extractText', () => {
    it('should extract text from a PDF File', async () => {
      const mockArrayBuffer = new ArrayBuffer(10);
      const mockFile = createMockFile(mockArrayBuffer, 'test.pdf');

      mockPage.getTextContent.mockResolvedValue({
        items: [{ str: 'Hello' }, { str: 'World' }],
      });
      mockPdf.getPage.mockResolvedValue(mockPage);

      const mockLoadingTask = { promise: Promise.resolve(mockPdf) };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const result = await adapter.extractText(mockFile);

      expect(result).toBe('Hello World\n\nHello World');
      expect(mockFile.arrayBuffer).toHaveBeenCalled();
      expect(pdfjsLib.getDocument).toHaveBeenCalledWith({
        data: mockArrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
    });

    it('should extract text from an ArrayBuffer', async () => {
      const mockArrayBuffer = new ArrayBuffer(10);

      mockPage.getTextContent.mockResolvedValue({
        items: [{ str: 'Test' }, { str: 'Content' }],
      });
      mockPdf.getPage.mockResolvedValue(mockPage);

      const mockLoadingTask = { promise: Promise.resolve(mockPdf) };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const result = await adapter.extractText(mockArrayBuffer);

      expect(result).toBe('Test Content\n\nTest Content');
      expect(pdfjsLib.getDocument).toHaveBeenCalledWith({
        data: mockArrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });
    });

    it('should handle PDF with single page', async () => {
      const mockArrayBuffer = new ArrayBuffer(10);
      const singlePagePdf = {
        numPages: 1,
        getPage: vi.fn(),
      };

      mockPage.getTextContent.mockResolvedValue({
        items: [{ str: 'Single page' }],
      });
      singlePagePdf.getPage.mockResolvedValue(mockPage);

      const mockLoadingTask = { promise: Promise.resolve(singlePagePdf) };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const result = await adapter.extractText(mockArrayBuffer);

      expect(result).toBe('Single page');
      expect(singlePagePdf.getPage).toHaveBeenCalledTimes(1);
    });

    it('should handle text items without str property', async () => {
      const mockArrayBuffer = new ArrayBuffer(10);

      mockPage.getTextContent.mockResolvedValue({
        items: [
          { str: 'Valid' },
          { notStr: 'Invalid' }, // Missing 'str' property
          { str: 'Text' },
        ],
      });
      mockPdf.getPage.mockResolvedValue(mockPage);

      const mockLoadingTask = { promise: Promise.resolve(mockPdf) };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const result = await adapter.extractText(mockArrayBuffer);

      expect(result).toBe('Valid  Text\n\nValid  Text');
    });

    it('should handle empty pages', async () => {
      const mockArrayBuffer = new ArrayBuffer(10);

      mockPage.getTextContent.mockResolvedValue({
        items: [],
      });
      mockPdf.getPage.mockResolvedValue(mockPage);

      const mockLoadingTask = { promise: Promise.resolve(mockPdf) };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      const result = await adapter.extractText(mockArrayBuffer);

      expect(result).toBe('\n\n');
    });

    it('should throw error when PDF loading fails', async () => {
      const mockArrayBuffer = new ArrayBuffer(10);
      const error = new Error('Invalid PDF');

      const mockLoadingTask = { promise: Promise.reject(error) };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      await expect(adapter.extractText(mockArrayBuffer)).rejects.toThrow(
        'Failed to extract text from PDF: Invalid PDF'
      );
    });

    it('should throw error with unknown error message', async () => {
      const mockArrayBuffer = new ArrayBuffer(10);

      const mockLoadingTask = { promise: Promise.reject('Unknown error type') };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      await expect(adapter.extractText(mockArrayBuffer)).rejects.toThrow(
        'Failed to extract text from PDF: Unknown error'
      );
    });

    it('should handle page extraction errors', async () => {
      const mockArrayBuffer = new ArrayBuffer(10);
      const error = new Error('Page extraction failed');

      mockPdf.getPage.mockRejectedValue(error);

      const mockLoadingTask = { promise: Promise.resolve(mockPdf) };
      vi.mocked(pdfjsLib.getDocument).mockReturnValue(mockLoadingTask as any);

      await expect(adapter.extractText(mockArrayBuffer)).rejects.toThrow(
        'Failed to extract text from PDF: Page extraction failed'
      );
    });
  });

  describe('getWebPdfAdapter', () => {
    it('should return singleton instance', () => {
      const instance1 = getWebPdfAdapter();
      const instance2 = getWebPdfAdapter();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(WebPdfAdapter);
    });
  });
});
