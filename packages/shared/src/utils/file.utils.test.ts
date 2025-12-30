import { describe, it, expect } from 'vitest';
import { FileUtils } from './file.utils';

describe('FileUtils', () => {
  // ============================================
  // formatFileSize
  // ============================================
  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(FileUtils.formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(FileUtils.formatFileSize(500)).toBe('500 Bytes');
    });

    it('should format kilobytes', () => {
      expect(FileUtils.formatFileSize(1024)).toBe('1 KB');
    });

    it('should format megabytes', () => {
      expect(FileUtils.formatFileSize(1048576)).toBe('1 MB');
    });

    it('should format gigabytes', () => {
      expect(FileUtils.formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(FileUtils.formatFileSize(1536, 1)).toBe('1.5 KB');
    });

    it('should format with default 2 decimal places', () => {
      expect(FileUtils.formatFileSize(1500)).toBe('1.46 KB');
    });
  });

  // ============================================
  // isArchive
  // ============================================
  describe('isArchive', () => {
    it('should return true for zip files', () => {
      expect(FileUtils.isArchive('file.zip')).toBe(true);
    });

    it('should return true for rar files', () => {
      expect(FileUtils.isArchive('file.rar')).toBe(true);
    });

    it('should return true for 7z files', () => {
      expect(FileUtils.isArchive('file.7z')).toBe(true);
    });

    it('should return true for tar files', () => {
      expect(FileUtils.isArchive('file.tar')).toBe(true);
    });

    it('should return false for non-archive files', () => {
      expect(FileUtils.isArchive('file.txt')).toBe(false);
    });

    it('should handle uppercase extensions', () => {
      expect(FileUtils.isArchive('file.ZIP')).toBe(true);
    });
  });

  // ============================================
  // isZipArchive
  // ============================================
  describe('isZipArchive', () => {
    it('should return true for zip files', () => {
      expect(FileUtils.isZipArchive('file.zip')).toBe(true);
    });

    it('should return false for other archives', () => {
      expect(FileUtils.isZipArchive('file.rar')).toBe(false);
    });

    it('should handle uppercase', () => {
      expect(FileUtils.isZipArchive('file.ZIP')).toBe(true);
    });
  });

  // ============================================
  // getMimeType
  // ============================================
  describe('getMimeType', () => {
    it('should return correct MIME type for images', () => {
      expect(FileUtils.getMimeType('jpg')).toBe('image/jpeg');
      expect(FileUtils.getMimeType('png')).toBe('image/png');
      expect(FileUtils.getMimeType('gif')).toBe('image/gif');
    });

    it('should return correct MIME type for documents', () => {
      expect(FileUtils.getMimeType('pdf')).toBe('application/pdf');
      expect(FileUtils.getMimeType('doc')).toBe('application/msword');
    });

    it('should return correct MIME type for archives', () => {
      expect(FileUtils.getMimeType('zip')).toBe('application/zip');
    });

    it('should return octet-stream for unknown extensions', () => {
      expect(FileUtils.getMimeType('xyz')).toBe('application/octet-stream');
    });

    it('should handle uppercase extensions', () => {
      expect(FileUtils.getMimeType('PDF')).toBe('application/pdf');
    });
  });

  // ============================================
  // getFileIconType
  // ============================================
  describe('getFileIconType', () => {
    it('should return image for image extensions', () => {
      expect(FileUtils.getFileIconType('jpg')).toBe('image');
      expect(FileUtils.getFileIconType('png')).toBe('image');
      expect(FileUtils.getFileIconType('gif')).toBe('image');
    });

    it('should return document for document extensions', () => {
      expect(FileUtils.getFileIconType('pdf')).toBe('document');
      expect(FileUtils.getFileIconType('doc')).toBe('document');
      expect(FileUtils.getFileIconType('txt')).toBe('document');
    });

    it('should return archive for archive extensions', () => {
      expect(FileUtils.getFileIconType('zip')).toBe('archive');
      expect(FileUtils.getFileIconType('rar')).toBe('archive');
    });

    it('should return audio for audio extensions', () => {
      expect(FileUtils.getFileIconType('mp3')).toBe('audio');
      expect(FileUtils.getFileIconType('wav')).toBe('audio');
    });

    it('should return video for video extensions', () => {
      expect(FileUtils.getFileIconType('mp4')).toBe('video');
      expect(FileUtils.getFileIconType('avi')).toBe('video');
    });

    it('should return code for code extensions', () => {
      expect(FileUtils.getFileIconType('js')).toBe('code');
      expect(FileUtils.getFileIconType('ts')).toBe('code');
      expect(FileUtils.getFileIconType('py')).toBe('code');
    });

    it('should return unknown for unknown extensions', () => {
      expect(FileUtils.getFileIconType('xyz')).toBe('unknown');
    });
  });

  // ============================================
  // generateUniqueFilename
  // ============================================
  describe('generateUniqueFilename', () => {
    it('should return original name if not exists', () => {
      const existing = new Set<string>();
      expect(FileUtils.generateUniqueFilename('file.txt', existing)).toBe('file.txt');
    });

    it('should add (1) if name exists', () => {
      const existing = new Set(['file.txt']);
      expect(FileUtils.generateUniqueFilename('file.txt', existing)).toBe('file (1).txt');
    });

    it('should increment counter for multiple conflicts', () => {
      const existing = new Set(['file.txt', 'file (1).txt', 'file (2).txt']);
      expect(FileUtils.generateUniqueFilename('file.txt', existing)).toBe('file (3).txt');
    });

    it('should handle files without extension', () => {
      const existing = new Set(['README']);
      expect(FileUtils.generateUniqueFilename('README', existing)).toBe('README (1)');
    });
  });

  // ============================================
  // validateFilename
  // ============================================
  describe('validateFilename', () => {
    it('should return valid for normal filename', () => {
      const result = FileUtils.validateFilename('document.pdf');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for empty filename', () => {
      const result = FileUtils.validateFilename('');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should return invalid for whitespace only', () => {
      const result = FileUtils.validateFilename('   ');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for filename with <', () => {
      const result = FileUtils.validateFilename('file<name.txt');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('invalid characters');
    });

    it('should return invalid for filename with >', () => {
      const result = FileUtils.validateFilename('file>name.txt');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for filename with :', () => {
      const result = FileUtils.validateFilename('file:name.txt');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for filename with /', () => {
      const result = FileUtils.validateFilename('file/name.txt');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for filename with \\', () => {
      const result = FileUtils.validateFilename('file\\name.txt');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for filename with |', () => {
      const result = FileUtils.validateFilename('file|name.txt');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for filename with ?', () => {
      const result = FileUtils.validateFilename('file?name.txt');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for filename with *', () => {
      const result = FileUtils.validateFilename('file*name.txt');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for reserved Windows names', () => {
      const result = FileUtils.validateFilename('CON.txt');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('reserved');
    });

    it('should return invalid for filename ending with dot', () => {
      const result = FileUtils.validateFilename('filename.');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('dot or space');
    });

    it('should return invalid for filename ending with space', () => {
      const result = FileUtils.validateFilename('filename ');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for filename exceeding 255 characters', () => {
      const longName = 'a'.repeat(256);
      const result = FileUtils.validateFilename(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should return valid for filename with exactly 255 characters', () => {
      const maxName = 'a'.repeat(251) + '.txt';
      const result = FileUtils.validateFilename(maxName);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for filename with spaces in middle', () => {
      const result = FileUtils.validateFilename('my document.pdf');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for filename with hyphens and underscores', () => {
      const result = FileUtils.validateFilename('my_document-2024.pdf');
      expect(result.isValid).toBe(true);
    });
  });
});
