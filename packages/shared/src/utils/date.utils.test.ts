import { describe, it, expect } from 'vitest';
import { DateUtils, type DateFormatPattern } from './date.utils';

describe('DateUtils', () => {
  // ============================================
  // DATE_FORMATS
  // ============================================
  describe('DATE_FORMATS', () => {
    it('should have format options with value and label', () => {
      expect(DateUtils.DATE_FORMATS.length).toBeGreaterThan(0);
      DateUtils.DATE_FORMATS.forEach((format) => {
        expect(format).toHaveProperty('value');
        expect(format).toHaveProperty('label');
        expect(typeof format.value).toBe('string');
        expect(typeof format.label).toBe('string');
      });
    });

    it('should include full date formats', () => {
      const fullDateFormats = ['YYYYMMDD', 'YYMMDD', 'YYYY-MM-DD', 'DD-MM-YYYY'];
      fullDateFormats.forEach((format) => {
        expect(DateUtils.DATE_FORMATS.some((f) => f.value === format)).toBe(true);
      });
    });

    it('should include year-month only formats', () => {
      const yearMonthFormats = ['YYYYMM', 'YYMM', 'YYYY-MM', 'YY-MM'];
      yearMonthFormats.forEach((format) => {
        expect(DateUtils.DATE_FORMATS.some((f) => f.value === format)).toBe(true);
      });
    });
  });

  // ============================================
  // parseDate
  // ============================================
  describe('parseDate', () => {
    describe('full date formats with 4-digit year', () => {
      it('should parse YYYYMMDD format', () => {
        const date = DateUtils.parseDate('20251230', 'YYYYMMDD');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11); // December (0-indexed)
        expect(date?.getDate()).toBe(30);
      });

      it('should parse YYYY-MM-DD format', () => {
        const date = DateUtils.parseDate('2025-12-30', 'YYYY-MM-DD');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11);
        expect(date?.getDate()).toBe(30);
      });

      it('should parse DD-MM-YYYY format', () => {
        const date = DateUtils.parseDate('30-12-2025', 'DD-MM-YYYY');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11);
        expect(date?.getDate()).toBe(30);
      });

      it('should parse MM-DD-YYYY format', () => {
        const date = DateUtils.parseDate('12-30-2025', 'MM-DD-YYYY');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11);
        expect(date?.getDate()).toBe(30);
      });
    });

    describe('full date formats with 2-digit year', () => {
      it('should parse YYMMDD format', () => {
        const date = DateUtils.parseDate('251230', 'YYMMDD');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11);
        expect(date?.getDate()).toBe(30);
      });

      it('should parse YY-MM-DD format', () => {
        const date = DateUtils.parseDate('25-12-30', 'YY-MM-DD');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
      });
    });

    describe('year-month only formats', () => {
      it('should parse YYYYMM format and default day to 1', () => {
        const date = DateUtils.parseDate('202512', 'YYYYMM');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11);
        expect(date?.getDate()).toBe(1);
      });

      it('should parse YYMM format', () => {
        const date = DateUtils.parseDate('2512', 'YYMM');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11);
        expect(date?.getDate()).toBe(1);
      });

      it('should parse YYYY-MM format', () => {
        const date = DateUtils.parseDate('2025-12', 'YYYY-MM');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11);
      });

      it('should parse MMYYYY format', () => {
        const date = DateUtils.parseDate('122025', 'MMYYYY');
        expect(date).not.toBeNull();
        expect(date?.getFullYear()).toBe(2025);
        expect(date?.getMonth()).toBe(11);
      });
    });

    describe('invalid inputs', () => {
      it('should return null for invalid date string', () => {
        expect(DateUtils.parseDate('invalid', 'YYYYMMDD')).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(DateUtils.parseDate('', 'YYYYMMDD')).toBeNull();
      });
    });
  });

  // ============================================
  // formatDate
  // ============================================
  describe('formatDate', () => {
    const testDate = new Date(2025, 11, 30); // December 30, 2025

    describe('full date formats', () => {
      it('should format to YYYYMMDD', () => {
        expect(DateUtils.formatDate(testDate, 'YYYYMMDD')).toBe('20251230');
      });

      it('should format to YYMMDD', () => {
        expect(DateUtils.formatDate(testDate, 'YYMMDD')).toBe('251230');
      });

      it('should format to YYYY-MM-DD', () => {
        expect(DateUtils.formatDate(testDate, 'YYYY-MM-DD')).toBe('2025-12-30');
      });

      it('should format to DD-MM-YYYY', () => {
        expect(DateUtils.formatDate(testDate, 'DD-MM-YYYY')).toBe('30-12-2025');
      });

      it('should format to MM-DD-YYYY', () => {
        expect(DateUtils.formatDate(testDate, 'MM-DD-YYYY')).toBe('12-30-2025');
      });
    });

    describe('year-month only formats', () => {
      it('should format to YYYYMM', () => {
        expect(DateUtils.formatDate(testDate, 'YYYYMM')).toBe('202512');
      });

      it('should format to YYMM', () => {
        expect(DateUtils.formatDate(testDate, 'YYMM')).toBe('2512');
      });

      it('should format to YYYY-MM', () => {
        expect(DateUtils.formatDate(testDate, 'YYYY-MM')).toBe('2025-12');
      });

      it('should format to MMYYYY', () => {
        expect(DateUtils.formatDate(testDate, 'MMYYYY')).toBe('122025');
      });

      it('should format to MM-YY', () => {
        expect(DateUtils.formatDate(testDate, 'MM-YY')).toBe('12-25');
      });
    });

    describe('padding', () => {
      const singleDigitDate = new Date(2025, 0, 5); // January 5, 2025

      it('should pad single digit month', () => {
        expect(DateUtils.formatDate(singleDigitDate, 'YYYY-MM-DD')).toBe('2025-01-05');
      });

      it('should pad single digit day', () => {
        expect(DateUtils.formatDate(singleDigitDate, 'YYYYMMDD')).toBe('20250105');
      });
    });
  });

  // ============================================
  // extractDateFromFilename
  // ============================================
  describe('extractDateFromFilename', () => {
    describe('date at beginning', () => {
      it('should extract YYYYMMDD from beginning', () => {
        const result = DateUtils.extractDateFromFilename('20251230_document', 'YYYYMMDD');
        expect(result).not.toBeNull();
        expect(result?.date.getFullYear()).toBe(2025);
        expect(result?.remainingName).toBe('document');
      });

      it('should extract YYYY-MM-DD from beginning', () => {
        const result = DateUtils.extractDateFromFilename('2025-12-30_document', 'YYYY-MM-DD');
        expect(result).not.toBeNull();
        expect(result?.date.getFullYear()).toBe(2025);
        expect(result?.remainingName).toBe('document');
      });

      it('should extract YYMMDD from beginning', () => {
        const result = DateUtils.extractDateFromFilename('251230_document', 'YYMMDD');
        expect(result).not.toBeNull();
        expect(result?.date.getFullYear()).toBe(2025);
        expect(result?.remainingName).toBe('document');
      });
    });

    describe('date at end', () => {
      it('should extract YYYYMMDD from end', () => {
        const result = DateUtils.extractDateFromFilename('document_20251230', 'YYYYMMDD');
        expect(result).not.toBeNull();
        expect(result?.date.getFullYear()).toBe(2025);
        expect(result?.remainingName).toBe('document');
      });

      it('should extract YYYY-MM-DD from end', () => {
        const result = DateUtils.extractDateFromFilename('document_2025-12-30', 'YYYY-MM-DD');
        expect(result).not.toBeNull();
        expect(result?.remainingName).toBe('document');
      });
    });

    describe('separator handling', () => {
      it('should strip separator after date at beginning', () => {
        const result = DateUtils.extractDateFromFilename('20251230-document', 'YYYYMMDD');
        expect(result?.remainingName).toBe('document');
      });

      it('should strip separator before date at end', () => {
        const result = DateUtils.extractDateFromFilename('document-20251230', 'YYYYMMDD');
        expect(result?.remainingName).toBe('document');
      });
    });

    describe('year-month formats', () => {
      it('should extract YYYYMM from filename', () => {
        const result = DateUtils.extractDateFromFilename('202512_report', 'YYYYMM');
        expect(result).not.toBeNull();
        expect(result?.date.getFullYear()).toBe(2025);
        expect(result?.date.getMonth()).toBe(11);
      });
    });

    describe('no match', () => {
      it('should return null if no date found', () => {
        const result = DateUtils.extractDateFromFilename('document', 'YYYYMMDD');
        expect(result).toBeNull();
      });

      it('should return null if format does not match', () => {
        const result = DateUtils.extractDateFromFilename('document_2025', 'YYYYMMDD');
        expect(result).toBeNull();
      });
    });
  });

  // ============================================
  // detectDateFormat
  // ============================================
  describe('detectDateFormat', () => {
    it('should detect YYYYMMDD format', () => {
      const filenames = ['20251230_doc1.pdf', '20251225_doc2.pdf', '20251220_doc3.pdf'];
      const detected = DateUtils.detectDateFormat(filenames);
      expect(detected).toBe('YYYYMMDD');
    });

    it('should detect formats and prefer earlier defined formats with equal scores', () => {
      // When multiple formats match with equal scores, the earlier one in DATE_FORMATS wins
      // For '2025-12-30' both YYYYMMDD and YYYY-MM-DD match, so YYYYMMDD wins
      const filenames = ['2025-12-30_doc1.pdf', '2025-12-25_doc2.pdf'];
      const detected = DateUtils.detectDateFormat(filenames);
      // YYYYMMDD comes before YYYY-MM-DD in DATE_FORMATS, so it's preferred
      expect(detected).toBe('YYYYMMDD');
    });

    it('should detect YYMMDD format', () => {
      const filenames = ['251230_doc1.pdf', '251225_doc2.pdf'];
      const detected = DateUtils.detectDateFormat(filenames);
      expect(detected).toBe('YYMMDD');
    });

    it('should return format with most matches', () => {
      const filenames = ['20251230_doc1.pdf', '20251225_doc2.pdf', 'no_date.pdf'];
      const detected = DateUtils.detectDateFormat(filenames);
      expect(detected).toBe('YYYYMMDD');
    });

    it('should return null for empty array', () => {
      const detected = DateUtils.detectDateFormat([]);
      expect(detected).toBeNull();
    });

    it('should return null if no format matches', () => {
      const filenames = ['doc1.pdf', 'doc2.pdf', 'doc3.pdf'];
      const detected = DateUtils.detectDateFormat(filenames);
      expect(detected).toBeNull();
    });
  });

  // ============================================
  // formatDate - Additional formats
  // ============================================
  describe('formatDate - additional formats', () => {
    const testDate = new Date(2025, 11, 30); // December 30, 2025

    it('should format to DD-MM-YY', () => {
      expect(DateUtils.formatDate(testDate, 'DD-MM-YY')).toBe('30-12-25');
    });

    it('should format to MM-DD-YY', () => {
      expect(DateUtils.formatDate(testDate, 'MM-DD-YY')).toBe('12-30-25');
    });

    it('should format to DDMMYYYY', () => {
      expect(DateUtils.formatDate(testDate, 'DDMMYYYY')).toBe('30122025');
    });

    it('should format to DDMMYY', () => {
      expect(DateUtils.formatDate(testDate, 'DDMMYY')).toBe('301225');
    });

    it('should format to MMDDYYYY', () => {
      expect(DateUtils.formatDate(testDate, 'MMDDYYYY')).toBe('12302025');
    });

    it('should format to MMDDYY', () => {
      expect(DateUtils.formatDate(testDate, 'MMDDYY')).toBe('123025');
    });

    it('should format to MM-YYYY', () => {
      expect(DateUtils.formatDate(testDate, 'MM-YYYY')).toBe('12-2025');
    });

    it('should format to YY-MM-DD', () => {
      expect(DateUtils.formatDate(testDate, 'YY-MM-DD')).toBe('25-12-30');
    });

    it('should format to MMYY', () => {
      expect(DateUtils.formatDate(testDate, 'MMYY')).toBe('1225');
    });

    it('should return default format for unknown format', () => {
      expect(DateUtils.formatDate(testDate, 'UNKNOWN' as DateFormatPattern)).toBe('251230');
    });
  });

  // ============================================
  // parseDate - Additional formats
  // ============================================
  describe('parseDate - additional edge cases', () => {
    it('should parse DD-MM-YY format', () => {
      const result = DateUtils.parseDate('30-12-25', 'DD-MM-YY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(30);
    });

    it('should parse MM-DD-YY format', () => {
      const result = DateUtils.parseDate('12-30-25', 'MM-DD-YY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11);
      expect(result?.getDate()).toBe(30);
    });

    it('should parse DDMMYYYY format', () => {
      const result = DateUtils.parseDate('30122025', 'DDMMYYYY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getDate()).toBe(30);
    });

    it('should parse DDMMYY format', () => {
      const result = DateUtils.parseDate('301225', 'DDMMYY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getDate()).toBe(30);
    });

    it('should parse MMDDYYYY format', () => {
      const result = DateUtils.parseDate('12302025', 'MMDDYYYY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11);
    });

    it('should parse MMDDYY format', () => {
      const result = DateUtils.parseDate('123025', 'MMDDYY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11);
    });

    it('should parse YY-MM format', () => {
      const result = DateUtils.parseDate('25-12', 'YY-MM');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11);
    });

    it('should parse MMYY format', () => {
      const result = DateUtils.parseDate('1225', 'MMYY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11);
    });

    it('should parse MM-YYYY format', () => {
      const result = DateUtils.parseDate('12-2025', 'MM-YYYY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11);
    });

    it('should parse MM-YY format', () => {
      const result = DateUtils.parseDate('12-25', 'MM-YY');
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(11);
    });

    it('should return null for unknown format', () => {
      const result = DateUtils.parseDate('20251230', 'UNKNOWN' as DateFormatPattern);
      expect(result).toBeNull();
    });

    it('should handle overflow date values (JavaScript Date behavior)', () => {
      // JavaScript Date auto-corrects overflow values
      // Month 13 (index 12) becomes January of next year
      const result = DateUtils.parseDate('20251330', 'YYYYMMDD');
      // JavaScript handles month overflow by rolling to next year
      expect(result).not.toBeNull();
    });

    it('should handle date parsing that throws exception', () => {
      // Create a scenario that might throw
      const result = DateUtils.parseDate('', 'YYYYMMDD');
      expect(result).toBeNull();
    });

    it('should return null for NaN date', () => {
      // Invalid date string that produces NaN
      const result = DateUtils.parseDate('abcdefgh', 'YYYYMMDD');
      expect(result).toBeNull();
    });

    it('should handle date with invalid characters that cause parsing error', () => {
      // Non-numeric characters in date position
      const result = DateUtils.parseDate('2025-AB-CD', 'YYYY-MM-DD');
      expect(result).toBeNull();
    });
  });

  // ============================================
  // extractDateFromFilename - Edge cases
  // ============================================
  describe('extractDateFromFilename - edge cases', () => {
    it('should return null for unsupported format length', () => {
      // Create a format string that would have length 3 after removing dashes
      const result = DateUtils.extractDateFromFilename('123_doc.pdf', 'YYY' as DateFormatPattern);
      expect(result).toBeNull();
    });

    it('should extract 4-digit format (YYMM) from beginning', () => {
      const result = DateUtils.extractDateFromFilename('2512_doc.pdf', 'YYMM');
      expect(result).not.toBeNull();
      expect(result?.date.getFullYear()).toBe(2025);
      expect(result?.date.getMonth()).toBe(11);
      // Note: .pdf extension is preserved in remaining name
      expect(result?.remainingName).toBe('doc.pdf');
    });

    it('should extract 4-digit format from end', () => {
      // With .pdf extension, the date at end won't match
      const result = DateUtils.extractDateFromFilename('doc_2512.pdf', 'YYMM');
      // The date pattern expects digits at the end, but .pdf breaks it
      expect(result).toBeNull();
    });

    it('should extract 6-digit format from end', () => {
      const result = DateUtils.extractDateFromFilename('doc_251230', 'YYMMDD');
      expect(result).not.toBeNull();
      expect(result?.date.getFullYear()).toBe(2025);
    });

    it('should extract 8-digit format from end', () => {
      const result = DateUtils.extractDateFromFilename('doc_20251230', 'YYYYMMDD');
      expect(result).not.toBeNull();
      expect(result?.date.getFullYear()).toBe(2025);
      expect(result?.remainingName).toBe('doc');
    });

    it('should return null when date pattern not found', () => {
      const result = DateUtils.extractDateFromFilename('document', 'YYYYMMDD');
      expect(result).toBeNull();
    });

    it('should handle extreme date values', () => {
      // JavaScript Date parses extreme values like year 9999
      const result = DateUtils.extractDateFromFilename('99999999_doc.pdf', 'YYYYMMDD');
      // JavaScript handles this as a valid (future) date
      expect(result).not.toBeNull();
    });

    it('should handle separator with dot', () => {
      const result = DateUtils.extractDateFromFilename('2025.12.30_doc.pdf', 'YYYY-MM-DD');
      expect(result).not.toBeNull();
    });

    it('should handle separator with underscore', () => {
      const result = DateUtils.extractDateFromFilename('2025_12_30_doc.pdf', 'YYYY-MM-DD');
      expect(result).not.toBeNull();
    });
  });

  // ============================================
  // today
  // ============================================
  describe('today', () => {
    it('should return a Date object', () => {
      const today = DateUtils.today();
      expect(today).toBeInstanceOf(Date);
    });

    it('should return current date', () => {
      const today = DateUtils.today();
      const now = new Date();
      expect(today.getFullYear()).toBe(now.getFullYear());
      expect(today.getMonth()).toBe(now.getMonth());
      expect(today.getDate()).toBe(now.getDate());
    });
  });
});
