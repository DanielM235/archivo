import type { IPdfUnlockAdapter } from '../interfaces/IPdfUnlockAdapter';

/**
 * Service for unlocking password-protected PDFs
 */
export class PdfUnlockService {
  private adapter: IPdfUnlockAdapter;

  constructor(adapter: IPdfUnlockAdapter) {
    this.adapter = adapter;
  }

  /**
   * Unlock a password-protected PDF
   * @param file - The PDF file to unlock
   * @param password - The password to use for unlocking
   * @returns Promise resolving to the unlocked PDF as a Blob
   */
  async unlockPdf(file: File, password: string): Promise<Blob> {
    return this.adapter.unlockPdf(file, password);
  }

  /**
   * Check if a PDF is password-protected
   * @param file - The PDF file to check
   * @returns Promise resolving to true if password-protected
   */
  async isPasswordProtected(file: File): Promise<boolean> {
    return this.adapter.isPasswordProtected(file);
  }

  /**
   * Derive password from reference number and number of digits
   * @param referenceNumber - The reference number (e.g., CPF)
   * @param numDigits - Number of first digits to use as password
   * @returns The derived password
   */
  derivePassword(referenceNumber: string, numDigits: number): string {
    // Remove non-numeric characters and take first N digits
    const numericOnly = referenceNumber.replace(/\D/g, '');
    return numericOnly.substring(0, numDigits);
  }
}
