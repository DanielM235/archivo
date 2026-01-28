/**
 * Validation result interface
 */
export interface IValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * String utility functions
 * Static methods for string manipulation
 */
export class StringUtils {
  /**
   * Allowed separator characters for filenames
   */
  static readonly ALLOWED_SEPARATORS = ['_', '-', ' '];

  /**
   * Regex pattern for valid custom name (alphanumeric + allowed separators)
   */
  static readonly CUSTOM_NAME_PATTERN = /^[a-zA-Z0-9_\- ]*$/;

  /**
   * Sanitize a filename by removing invalid characters
   * @param filename - The filename to sanitize
   * @returns Sanitized filename
   */
  static sanitizeFilename(filename: string): string {
    // Remove characters that are invalid in Windows/Mac/Linux filenames
    return (
      filename
        // eslint-disable-next-line no-control-regex
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  /**
   * Validate a custom name for file renaming
   * Only allows letters, numbers, and separator characters (underscore, hyphen, space)
   * @param name - The name to validate
   * @returns Validation result with isValid flag and optional error message
   */
  static validateCustomName(name: string | undefined | null): IValidationResult {
    // Empty or null is valid (means use original name)
    if (name === null || name === undefined || name.trim().length === 0) {
      return { isValid: true };
    }

    // Check for valid characters only (letters, numbers, and separators)
    if (!this.CUSTOM_NAME_PATTERN.test(name)) {
      return {
        isValid: false,
        error: 'Only letters, numbers, underscore (_), hyphen (-), and space are allowed',
      };
    }

    // Check for leading/trailing spaces
    if (name !== name.trim()) {
      return {
        isValid: false,
        error: 'Name cannot start or end with a space',
      };
    }

    // Check for consecutive spaces
    if (/\s{2,}/.test(name)) {
      return {
        isValid: false,
        error: 'Name cannot contain consecutive spaces',
      };
    }

    // Check maximum length
    if (name.length > 200) {
      return {
        isValid: false,
        error: 'Name cannot exceed 200 characters',
      };
    }

    return { isValid: true };
  }

  /**
   * Check if a custom name is valid
   * Convenience method that returns only the boolean result
   * @param name - The name to validate
   * @returns True if valid, false otherwise
   */
  static isValidCustomName(name: string | undefined | null): boolean {
    return this.validateCustomName(name).isValid;
  }

  /**
   * Extract the file extension from a filename
   * @param filename - The filename to extract extension from
   * @returns The extension without the dot, or empty string if no extension
   */
  static getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return '';
    }
    return filename.slice(lastDot + 1).toLowerCase();
  }

  /**
   * Extract the filename without extension
   * @param filename - The filename to process
   * @returns The filename without its extension
   */
  static getNameWithoutExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1 || lastDot === 0) {
      return filename;
    }
    return filename.slice(0, lastDot);
  }

  /**
   * Join name parts with a separator
   * @param parts - Array of name parts
   * @param separator - Separator to use
   * @returns Joined string
   */
  static joinWithSeparator(parts: string[], separator: string): string {
    return parts.filter((part) => part.length > 0).join(separator);
  }

  /**
   * Pad a string or number to a specific length
   * @param value - Value to pad
   * @param length - Desired length
   * @param padChar - Character to pad with (default '0')
   * @returns Padded string
   */
  static padStart(value: string | number, length: number, padChar: string = '0'): string {
    return String(value).padStart(length, padChar);
  }

  /**
   * Check if a string is empty or contains only whitespace
   * @param value - String to check
   * @returns True if empty or whitespace only
   */
  static isEmpty(value: string | null | undefined): boolean {
    return value === null || value === undefined || value.trim().length === 0;
  }

  /**
   * Truncate a string to a maximum length
   * @param value - String to truncate
   * @param maxLength - Maximum length
   * @param suffix - Suffix to add if truncated (default '...')
   * @returns Truncated string
   */
  static truncate(value: string, maxLength: number, suffix: string = '...'): string {
    if (value.length <= maxLength) {
      return value;
    }
    return value.slice(0, maxLength - suffix.length) + suffix;
  }
}
