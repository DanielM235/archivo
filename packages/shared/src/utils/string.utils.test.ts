import { describe, it, expect } from 'vitest';
import { StringUtils } from './string.utils';

describe('StringUtils', () => {
  // ============================================
  // sanitizeFilename
  // ============================================
  describe('sanitizeFilename', () => {
    it('should return the same filename if no invalid characters', () => {
      expect(StringUtils.sanitizeFilename('valid-filename.txt')).toBe('valid-filename.txt');
    });

    it('should remove invalid characters', () => {
      expect(StringUtils.sanitizeFilename('file<>:"/\\|?*.txt')).toBe('file.txt');
    });

    it('should replace multiple spaces with single space', () => {
      expect(StringUtils.sanitizeFilename('file   name.txt')).toBe('file name.txt');
    });

    it('should trim leading and trailing spaces', () => {
      expect(StringUtils.sanitizeFilename('  filename.txt  ')).toBe('filename.txt');
    });

    it('should handle empty string', () => {
      expect(StringUtils.sanitizeFilename('')).toBe('');
    });

    it('should remove control characters', () => {
      expect(StringUtils.sanitizeFilename('file\x00\x1fname.txt')).toBe('filename.txt');
    });
  });

  // ============================================
  // validateCustomName
  // ============================================
  describe('validateCustomName', () => {
    it('should return valid for empty string', () => {
      const result = StringUtils.validateCustomName('');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for null', () => {
      const result = StringUtils.validateCustomName(null);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for undefined', () => {
      const result = StringUtils.validateCustomName(undefined);
      expect(result.isValid).toBe(true);
    });

    it('should return valid for alphanumeric name', () => {
      const result = StringUtils.validateCustomName('MyFile123');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for name with underscore', () => {
      const result = StringUtils.validateCustomName('my_file_name');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for name with hyphen', () => {
      const result = StringUtils.validateCustomName('my-file-name');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for name with space', () => {
      const result = StringUtils.validateCustomName('my file name');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for name with mixed separators', () => {
      const result = StringUtils.validateCustomName('my_file-name 2024');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for name with special characters', () => {
      const result = StringUtils.validateCustomName('file@name');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Only letters, numbers');
    });

    it('should return invalid for name with dot', () => {
      const result = StringUtils.validateCustomName('file.name');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for name with slash', () => {
      const result = StringUtils.validateCustomName('file/name');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for name with backslash', () => {
      const result = StringUtils.validateCustomName('file\\name');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for name with leading space', () => {
      const result = StringUtils.validateCustomName(' filename');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('start or end with a space');
    });

    it('should return invalid for name with trailing space', () => {
      const result = StringUtils.validateCustomName('filename ');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('start or end with a space');
    });

    it('should return invalid for name with consecutive spaces', () => {
      const result = StringUtils.validateCustomName('file  name');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('consecutive spaces');
    });

    it('should return invalid for name exceeding 200 characters', () => {
      const longName = 'a'.repeat(201);
      const result = StringUtils.validateCustomName(longName);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('200 characters');
    });

    it('should return valid for name with exactly 200 characters', () => {
      const maxName = 'a'.repeat(200);
      const result = StringUtils.validateCustomName(maxName);
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for name with unicode characters', () => {
      const result = StringUtils.validateCustomName('fichier_été');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for name with emoji', () => {
      const result = StringUtils.validateCustomName('file🎉name');
      expect(result.isValid).toBe(false);
    });
  });

  // ============================================
  // isValidCustomName
  // ============================================
  describe('isValidCustomName', () => {
    it('should return true for valid name', () => {
      expect(StringUtils.isValidCustomName('ValidName123')).toBe(true);
    });

    it('should return false for invalid name', () => {
      expect(StringUtils.isValidCustomName('Invalid@Name')).toBe(false);
    });

    it('should return true for empty string', () => {
      expect(StringUtils.isValidCustomName('')).toBe(true);
    });

    it('should return true for null', () => {
      expect(StringUtils.isValidCustomName(null)).toBe(true);
    });
  });

  // ============================================
  // getExtension
  // ============================================
  describe('getExtension', () => {
    it('should return extension without dot', () => {
      expect(StringUtils.getExtension('file.txt')).toBe('txt');
    });

    it('should return lowercase extension', () => {
      expect(StringUtils.getExtension('file.TXT')).toBe('txt');
    });

    it('should return last extension for multiple dots', () => {
      expect(StringUtils.getExtension('file.name.txt')).toBe('txt');
    });

    it('should return empty string for no extension', () => {
      expect(StringUtils.getExtension('filename')).toBe('');
    });

    it('should return empty string for dot at beginning', () => {
      expect(StringUtils.getExtension('.htaccess')).toBe('');
    });

    it('should handle empty string', () => {
      expect(StringUtils.getExtension('')).toBe('');
    });
  });

  // ============================================
  // getNameWithoutExtension
  // ============================================
  describe('getNameWithoutExtension', () => {
    it('should return name without extension', () => {
      expect(StringUtils.getNameWithoutExtension('file.txt')).toBe('file');
    });

    it('should handle multiple dots', () => {
      expect(StringUtils.getNameWithoutExtension('file.name.txt')).toBe('file.name');
    });

    it('should return full name if no extension', () => {
      expect(StringUtils.getNameWithoutExtension('filename')).toBe('filename');
    });

    it('should return full name for dotfiles', () => {
      expect(StringUtils.getNameWithoutExtension('.htaccess')).toBe('.htaccess');
    });

    it('should handle empty string', () => {
      expect(StringUtils.getNameWithoutExtension('')).toBe('');
    });
  });

  // ============================================
  // joinWithSeparator
  // ============================================
  describe('joinWithSeparator', () => {
    it('should join parts with separator', () => {
      expect(StringUtils.joinWithSeparator(['part1', 'part2'], '_')).toBe('part1_part2');
    });

    it('should skip empty parts', () => {
      expect(StringUtils.joinWithSeparator(['part1', '', 'part2'], '_')).toBe('part1_part2');
    });

    it('should handle single part', () => {
      expect(StringUtils.joinWithSeparator(['part1'], '_')).toBe('part1');
    });

    it('should handle empty array', () => {
      expect(StringUtils.joinWithSeparator([], '_')).toBe('');
    });

    it('should handle empty separator', () => {
      expect(StringUtils.joinWithSeparator(['part1', 'part2'], '')).toBe('part1part2');
    });

    it('should handle space separator', () => {
      expect(StringUtils.joinWithSeparator(['part1', 'part2'], ' ')).toBe('part1 part2');
    });
  });

  // ============================================
  // padStart
  // ============================================
  describe('padStart', () => {
    it('should pad number with zeros', () => {
      expect(StringUtils.padStart(5, 3)).toBe('005');
    });

    it('should pad string', () => {
      expect(StringUtils.padStart('5', 3)).toBe('005');
    });

    it('should use custom pad character', () => {
      expect(StringUtils.padStart(5, 3, 'x')).toBe('xx5');
    });

    it('should not pad if already long enough', () => {
      expect(StringUtils.padStart(123, 2)).toBe('123');
    });
  });

  // ============================================
  // isEmpty
  // ============================================
  describe('isEmpty', () => {
    it('should return true for empty string', () => {
      expect(StringUtils.isEmpty('')).toBe(true);
    });

    it('should return true for whitespace only', () => {
      expect(StringUtils.isEmpty('   ')).toBe(true);
    });

    it('should return true for null', () => {
      expect(StringUtils.isEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(StringUtils.isEmpty(undefined)).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(StringUtils.isEmpty('hello')).toBe(false);
    });

    it('should return false for string with content and spaces', () => {
      expect(StringUtils.isEmpty('  hello  ')).toBe(false);
    });
  });

  // ============================================
  // truncate
  // ============================================
  describe('truncate', () => {
    it('should truncate long string', () => {
      expect(StringUtils.truncate('hello world', 8)).toBe('hello...');
    });

    it('should not truncate short string', () => {
      expect(StringUtils.truncate('hello', 10)).toBe('hello');
    });

    it('should use custom suffix', () => {
      expect(StringUtils.truncate('hello world', 8, '…')).toBe('hello w…');
    });

    it('should handle exact length', () => {
      expect(StringUtils.truncate('hello', 5)).toBe('hello');
    });
  });
});
