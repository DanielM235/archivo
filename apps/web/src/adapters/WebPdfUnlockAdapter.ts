import type { IPdfUnlockAdapter } from '@archivo/shared';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href;

/**
 * Web implementation of the PDF unlock adapter using PDF.js and pdf-lib
 */
export class WebPdfUnlockAdapter implements IPdfUnlockAdapter {
  /**
   * Unlock a password-protected PDF
   * @param file - The PDF file to unlock
   * @param password - The password to use for unlocking
   * @returns Promise resolving to the unlocked PDF as a Blob
   */
  async unlockPdf(file: File, password: string): Promise<Blob> {
    try {
      // First check if the PDF is actually password protected
      const isProtected = await this.isPasswordProtected(file);
      if (!isProtected) {
        throw new Error(
          'The selected PDF is not password-protected. Please select a password-protected PDF file.'
        );
      }

      // Get fresh ArrayBuffer for PDF.js operations
      const arrayBufferForValidation = await file.arrayBuffer();

      let pdfDocument;
      try {
        // Try to load with PDF.js and password
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBufferForValidation,
          password: password,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
        });

        pdfDocument = await loadingTask.promise;
      } catch (pdfjsError) {
        if (pdfjsError instanceof Error) {
          if (pdfjsError.name === 'PasswordException') {
            throw new Error('Invalid password. Please check your password and try again.');
          }
          if (pdfjsError.name === 'InvalidPDFException') {
            throw new Error('Invalid PDF file format. Please select a valid PDF file.');
          }
          if (pdfjsError.name === 'MissingPDFException') {
            throw new Error(
              'PDF file appears to be corrupted or incomplete. Please select a different PDF file.'
            );
          }
          throw new Error(`PDF loading failed: ${pdfjsError.message}`);
        }
        throw new Error('Failed to load PDF with provided password.');
      }

      // Get the decrypted PDF as bytes
      let data;
      try {
        data = await pdfDocument.getData();
      } catch {
        throw new Error('Failed to extract PDF data after decryption.');
      }

      // Variables for PDF processing
      let unlockedPdfBytes;
      let cleanUint8Array;

      // Now load the decrypted data with pdf-lib to ensure it's properly saved without encryption
      let pdfDoc;

      try {
        // Try loading with the Uint8Array directly
        pdfDoc = await PDFDocument.load(data);
      } catch (pdflibError) {
        console.warn(
          'pdf-lib failed to load decrypted data, creating new PDF from rendered pages:',
          pdflibError
        );

        // Fallback: Create a new PDF by rendering each page to canvas and adding as images
        try {
          const newPdfDoc = await PDFDocument.create();

          // Get the number of pages
          const numPages = pdfDocument.numPages;

          for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality

            // Create a canvas
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Could not get canvas context');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render the page
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
              canvas: canvas,
            };

            await page.render(renderContext).promise;

            // Convert canvas to PNG
            const pngData = canvas.toDataURL('image/png');

            // Add the image to the new PDF
            const pngImage = await newPdfDoc.embedPng(pngData);
            const newPage = newPdfDoc.addPage([pngImage.width, pngImage.height]);
            newPage.drawImage(pngImage, {
              x: 0,
              y: 0,
              width: pngImage.width,
              height: pngImage.height,
            });
          }

          // Save the new document
          unlockedPdfBytes = await newPdfDoc.save();
          cleanUint8Array = new Uint8Array(unlockedPdfBytes);
          return new Blob([cleanUint8Array], { type: 'application/pdf' });
        } catch (renderError) {
          console.warn('PDF rendering failed, returning raw decrypted data:', renderError);
          cleanUint8Array = new Uint8Array(data);
          return new Blob([cleanUint8Array], { type: 'application/pdf' });
        }
      }

      // Save without encryption
      try {
        unlockedPdfBytes = await pdfDoc.save();
      } catch {
        throw new Error('Failed to save the unlocked PDF.');
      }

      // Create a new Uint8Array to avoid SharedArrayBuffer issues
      cleanUint8Array = new Uint8Array(unlockedPdfBytes);

      // Create blob directly from Uint8Array
      return new Blob([cleanUint8Array], { type: 'application/pdf' });
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw specific errors
        if (
          error.message.includes('password-protected') ||
          error.message.includes('Invalid password') ||
          error.message.includes('PDF loading failed') ||
          error.message.includes('extract PDF data') ||
          error.message.includes('save the unlocked PDF') ||
          error.message.includes('Invalid PDF file format') ||
          error.message.includes('corrupted or incomplete')
        ) {
          throw error;
        }

        // Generic fallback
        throw new Error(`PDF unlock failed: ${error.message}`);
      }
      throw new Error('An unexpected error occurred while unlocking the PDF.');
    }
  }

  /**
   * Check if a PDF is password-protected
   * @param file - The PDF file to check
   * @returns Promise resolving to true if password-protected
   */
  async isPasswordProtected(file: File): Promise<boolean> {
    // Get fresh ArrayBuffer for pdf-lib check
    const arrayBufferForPdfLib = await file.arrayBuffer();

    try {
      // Try to load without password using pdf-lib
      await PDFDocument.load(arrayBufferForPdfLib);
      return false; // Successfully loaded without password
    } catch {
      // If it fails, it might be password protected
      // Get fresh ArrayBuffer for PDF.js check
      const arrayBufferForPdfJs = await file.arrayBuffer();

      try {
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBufferForPdfJs,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
        });

        await loadingTask.promise;
        return false; // Successfully loaded without password
      } catch (pdfjsError) {
        if (pdfjsError instanceof Error && pdfjsError.name === 'PasswordException') {
          return true; // Password required
        }
        return false; // Other error, assume not password protected
      }
    }
  }
}

/**
 * Get the web PDF unlock adapter instance
 */
export function getWebPdfUnlockAdapter(): IPdfUnlockAdapter {
  return new WebPdfUnlockAdapter();
}
