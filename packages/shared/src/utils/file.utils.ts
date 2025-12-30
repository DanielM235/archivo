/**
 * File utility functions
 * Static methods for file manipulation
 */
export class FileUtils {
  /**
   * Common archive file extensions
   */
  static readonly ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

  /**
   * Format file size in human-readable format
   * @param bytes - Size in bytes
   * @param decimals - Number of decimal places (default 2)
   * @returns Formatted size string
   */
  static formatFileSize(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
  }

  /**
   * Check if a file is an archive based on its extension
   * @param filename - The filename to check
   * @returns True if the file is an archive
   */
  static isArchive(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return this.ARCHIVE_EXTENSIONS.includes(extension);
  }

  /**
   * Check if a file is a zip archive
   * @param filename - The filename to check
   * @returns True if the file is a zip archive
   */
  static isZipArchive(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return extension === 'zip';
  }

  /**
   * Get the MIME type for a file extension
   * @param extension - The file extension
   * @returns MIME type string
   */
  static getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      // Images
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      ico: 'image/x-icon',
      // Documents
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Text
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      xml: 'application/xml',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      ts: 'application/typescript',
      // Archives
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      tar: 'application/x-tar',
      gz: 'application/gzip',
      // Audio
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      // Video
      mp4: 'video/mp4',
      webm: 'video/webm',
      avi: 'video/x-msvideo',
      mov: 'video/quicktime',
    };

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Get a file icon name based on extension (for MUI icons)
   * @param extension - The file extension
   * @returns Icon name
   */
  static getFileIconType(
    extension: string
  ): 'image' | 'document' | 'archive' | 'audio' | 'video' | 'code' | 'unknown' {
    const ext = extension.toLowerCase();

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico', 'bmp', 'tiff'];
    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'];
    const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    const videoExtensions = ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv'];
    const codeExtensions = [
      'js',
      'ts',
      'jsx',
      'tsx',
      'html',
      'css',
      'scss',
      'json',
      'xml',
      'py',
      'java',
      'c',
      'cpp',
      'h',
      'rb',
      'go',
      'rs',
      'php',
    ];

    if (imageExtensions.includes(ext)) return 'image';
    if (documentExtensions.includes(ext)) return 'document';
    if (archiveExtensions.includes(ext)) return 'archive';
    if (audioExtensions.includes(ext)) return 'audio';
    if (videoExtensions.includes(ext)) return 'video';
    if (codeExtensions.includes(ext)) return 'code';

    return 'unknown';
  }

  /**
   * Generate a unique filename by adding a suffix if the file exists
   * @param filename - The base filename
   * @param existingNames - Set of existing filenames
   * @returns Unique filename
   */
  static generateUniqueFilename(filename: string, existingNames: Set<string>): string {
    if (!existingNames.has(filename)) {
      return filename;
    }

    const dotIndex = filename.lastIndexOf('.');
    const name = dotIndex > 0 ? filename.slice(0, dotIndex) : filename;
    const extension = dotIndex > 0 ? filename.slice(dotIndex) : '';

    let counter = 1;
    let newFilename: string;

    do {
      newFilename = `${name} (${counter})${extension}`;
      counter++;
    } while (existingNames.has(newFilename));

    return newFilename;
  }

  /**
   * Validate a filename
   * @param filename - The filename to validate
   * @returns Object with isValid flag and optional error message
   */
  static validateFilename(filename: string): { isValid: boolean; error?: string } {
    if (!filename || filename.trim().length === 0) {
      return { isValid: false, error: 'Filename cannot be empty' };
    }

    // Check for invalid characters
    // eslint-disable-next-line no-control-regex
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(filename)) {
      return { isValid: false, error: 'Filename contains invalid characters' };
    }

    // Check for reserved names (Windows)
    const reservedNames = [
      'CON',
      'PRN',
      'AUX',
      'NUL',
      'COM1',
      'COM2',
      'COM3',
      'COM4',
      'COM5',
      'COM6',
      'COM7',
      'COM8',
      'COM9',
      'LPT1',
      'LPT2',
      'LPT3',
      'LPT4',
      'LPT5',
      'LPT6',
      'LPT7',
      'LPT8',
      'LPT9',
    ];
    const splitName = filename.split('.');
    const nameWithoutExt = (splitName[0] ?? '').toUpperCase();
    if (reservedNames.includes(nameWithoutExt)) {
      return { isValid: false, error: 'Filename is a reserved system name' };
    }

    // Check for trailing dots or spaces
    if (filename.endsWith('.') || filename.endsWith(' ')) {
      return { isValid: false, error: 'Filename cannot end with a dot or space' };
    }

    // Check length
    if (filename.length > 255) {
      return { isValid: false, error: 'Filename is too long (max 255 characters)' };
    }

    return { isValid: true };
  }
}
