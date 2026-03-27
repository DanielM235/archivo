/**
 * Interface for PDF unlock adapters
 */
export interface IPdfUnlockAdapter {
  /**
   * Unlock a password-protected PDF
   * @param file - The PDF file to unlock
   * @param password - The password to use for unlocking
   * @returns Promise resolving to the unlocked PDF as a Blob
   */
  unlockPdf(file: File, password: string): Promise<Blob>;

  /**
   * Check if a PDF is password-protected
   * @param file - The PDF file to check
   * @returns Promise resolving to true if password-protected
   */
  isPasswordProtected(file: File): Promise<boolean>;
}
