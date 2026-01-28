import type { IPdfTextAdapter } from '@archivo/shared';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

/**
 * Web implementation of the PDF text extraction adapter using PDF.js
 */
export class WebPdfAdapter implements IPdfTextAdapter {
  /**
   * Extract text content from a PDF file
   * @param file - File object or ArrayBuffer containing PDF data
   * @returns Promise resolving to the extracted text
   */
  async extractText(file: File | ArrayBuffer): Promise<string> {
    try {
      // Convert File to ArrayBuffer if needed
      const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;

      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true,
      });

      const pdf = await loadingTask.promise;
      const textParts: string[] = [];

      // Extract text from each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        // Combine text items, preserving some structure
        const pageText = textContent.items
          .map((item) => {
            if ('str' in item) {
              return item.str;
            }
            return '';
          })
          .join(' ');

        textParts.push(pageText);
      }

      return textParts.join('\n\n');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
    }
  }
}

// Singleton instance
let webPdfAdapterInstance: WebPdfAdapter | null = null;

/**
 * Get singleton instance of WebPdfAdapter
 */
export function getWebPdfAdapter(): WebPdfAdapter {
  if (!webPdfAdapterInstance) {
    webPdfAdapterInstance = new WebPdfAdapter();
  }
  return webPdfAdapterInstance;
}
