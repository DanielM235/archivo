/**
 * Date format patterns supported by the application
 */
export type DateFormatPattern =
  | 'YYYYMMDD'
  | 'YYMMDD'
  | 'YYYY-MM-DD'
  | 'YY-MM-DD'
  | 'DD-MM-YYYY'
  | 'DD-MM-YY'
  | 'MM-DD-YYYY'
  | 'MM-DD-YY'
  | 'DDMMYYYY'
  | 'DDMMYY'
  | 'MMDDYYYY'
  | 'MMDDYY'
  | 'YYYYMM'
  | 'YYMM'
  | 'YYYY-MM'
  | 'YY-MM'
  | 'MMYYYY'
  | 'MMYY'
  | 'MM-YYYY'
  | 'MM-YY';

/**
 * Date utility functions
 * Static methods for date parsing and formatting
 */
export class DateUtils {
  /**
   * Available date format patterns with their descriptions
   */
  static readonly DATE_FORMATS: { value: DateFormatPattern; label: string }[] = [
    // Full date formats (year, month, day)
    { value: 'YYYYMMDD', label: 'YYYYMMDD (20251230)' },
    { value: 'YYMMDD', label: 'YYMMDD (251230)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2025-12-30)' },
    { value: 'YY-MM-DD', label: 'YY-MM-DD (25-12-30)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (30-12-2025)' },
    { value: 'DD-MM-YY', label: 'DD-MM-YY (30-12-25)' },
    { value: 'MM-DD-YYYY', label: 'MM-DD-YYYY (12-30-2025)' },
    { value: 'MM-DD-YY', label: 'MM-DD-YY (12-30-25)' },
    { value: 'DDMMYYYY', label: 'DDMMYYYY (30122025)' },
    { value: 'DDMMYY', label: 'DDMMYY (301225)' },
    { value: 'MMDDYYYY', label: 'MMDDYYYY (12302025)' },
    { value: 'MMDDYY', label: 'MMDDYY (123025)' },
    // Year-month only formats
    { value: 'YYYYMM', label: 'YYYYMM (202512)' },
    { value: 'YYMM', label: 'YYMM (2512)' },
    { value: 'YYYY-MM', label: 'YYYY-MM (2025-12)' },
    { value: 'YY-MM', label: 'YY-MM (25-12)' },
    { value: 'MMYYYY', label: 'MMYYYY (122025)' },
    { value: 'MMYY', label: 'MMYY (1225)' },
    { value: 'MM-YYYY', label: 'MM-YYYY (12-2025)' },
    { value: 'MM-YY', label: 'MM-YY (12-25)' },
  ];

  /**
   * Parse a date string based on the specified format
   * @param dateString - The date string to parse
   * @param format - The format of the date string
   * @returns Parsed Date object or null if parsing fails
   */
  static parseDate(dateString: string, format: DateFormatPattern): Date | null {
    try {
      // Remove any separators for easier parsing
      const cleanDate = dateString.replace(/[-/_.]/g, '');

      let year: number;
      let month: number;
      let day: number;

      switch (format) {
        case 'YYYYMMDD':
          year = parseInt(cleanDate.slice(0, 4), 10);
          month = parseInt(cleanDate.slice(4, 6), 10) - 1;
          day = parseInt(cleanDate.slice(6, 8), 10);
          break;
        case 'YYMMDD':
          year = 2000 + parseInt(cleanDate.slice(0, 2), 10);
          month = parseInt(cleanDate.slice(2, 4), 10) - 1;
          day = parseInt(cleanDate.slice(4, 6), 10);
          break;
        case 'YYYY-MM-DD':
          year = parseInt(cleanDate.slice(0, 4), 10);
          month = parseInt(cleanDate.slice(4, 6), 10) - 1;
          day = parseInt(cleanDate.slice(6, 8), 10);
          break;
        case 'YY-MM-DD':
          year = 2000 + parseInt(cleanDate.slice(0, 2), 10);
          month = parseInt(cleanDate.slice(2, 4), 10) - 1;
          day = parseInt(cleanDate.slice(4, 6), 10);
          break;
        case 'DD-MM-YYYY':
        case 'DDMMYYYY':
          day = parseInt(cleanDate.slice(0, 2), 10);
          month = parseInt(cleanDate.slice(2, 4), 10) - 1;
          year = parseInt(cleanDate.slice(4, 8), 10);
          break;
        case 'DD-MM-YY':
        case 'DDMMYY':
          day = parseInt(cleanDate.slice(0, 2), 10);
          month = parseInt(cleanDate.slice(2, 4), 10) - 1;
          year = 2000 + parseInt(cleanDate.slice(4, 6), 10);
          break;
        case 'MM-DD-YYYY':
        case 'MMDDYYYY':
          month = parseInt(cleanDate.slice(0, 2), 10) - 1;
          day = parseInt(cleanDate.slice(2, 4), 10);
          year = parseInt(cleanDate.slice(4, 8), 10);
          break;
        case 'MM-DD-YY':
        case 'MMDDYY':
          month = parseInt(cleanDate.slice(0, 2), 10) - 1;
          day = parseInt(cleanDate.slice(2, 4), 10);
          year = 2000 + parseInt(cleanDate.slice(4, 6), 10);
          break;
        // Year-month only formats (day defaults to 1)
        case 'YYYYMM':
        case 'YYYY-MM':
          year = parseInt(cleanDate.slice(0, 4), 10);
          month = parseInt(cleanDate.slice(4, 6), 10) - 1;
          day = 1;
          break;
        case 'YYMM':
        case 'YY-MM':
          year = 2000 + parseInt(cleanDate.slice(0, 2), 10);
          month = parseInt(cleanDate.slice(2, 4), 10) - 1;
          day = 1;
          break;
        case 'MMYYYY':
        case 'MM-YYYY':
          month = parseInt(cleanDate.slice(0, 2), 10) - 1;
          year = parseInt(cleanDate.slice(2, 6), 10);
          day = 1;
          break;
        case 'MMYY':
        case 'MM-YY':
          month = parseInt(cleanDate.slice(0, 2), 10) - 1;
          year = 2000 + parseInt(cleanDate.slice(2, 4), 10);
          day = 1;
          break;
        default:
          return null;
      }

      const date = new Date(year, month, day);

      // Validate the date
      if (isNaN(date.getTime())) {
        return null;
      }

      return date;
    } catch {
      return null;
    }
  }

  /**
   * Format a date according to the specified format
   * @param date - The date to format
   * @param format - The desired output format
   * @returns Formatted date string
   */
  static formatDate(date: Date, format: DateFormatPattern): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const yy = String(year).slice(-2);
    const yyyy = String(year);
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');

    switch (format) {
      case 'YYYYMMDD':
        return `${yyyy}${mm}${dd}`;
      case 'YYMMDD':
        return `${yy}${mm}${dd}`;
      case 'YYYY-MM-DD':
        return `${yyyy}-${mm}-${dd}`;
      case 'YY-MM-DD':
        return `${yy}-${mm}-${dd}`;
      case 'DD-MM-YYYY':
        return `${dd}-${mm}-${yyyy}`;
      case 'DD-MM-YY':
        return `${dd}-${mm}-${yy}`;
      case 'MM-DD-YYYY':
        return `${mm}-${dd}-${yyyy}`;
      case 'MM-DD-YY':
        return `${mm}-${dd}-${yy}`;
      case 'DDMMYYYY':
        return `${dd}${mm}${yyyy}`;
      case 'DDMMYY':
        return `${dd}${mm}${yy}`;
      case 'MMDDYYYY':
        return `${mm}${dd}${yyyy}`;
      case 'MMDDYY':
        return `${mm}${dd}${yy}`;
      // Year-month only formats
      case 'YYYYMM':
        return `${yyyy}${mm}`;
      case 'YYMM':
        return `${yy}${mm}`;
      case 'YYYY-MM':
        return `${yyyy}-${mm}`;
      case 'YY-MM':
        return `${yy}-${mm}`;
      case 'MMYYYY':
        return `${mm}${yyyy}`;
      case 'MMYY':
        return `${mm}${yy}`;
      case 'MM-YYYY':
        return `${mm}-${yyyy}`;
      case 'MM-YY':
        return `${mm}-${yy}`;
      default:
        return `${yy}${mm}${dd}`;
    }
  }

  /**
   * Extract a date from a filename using the specified format
   * @param filename - The filename to extract date from
   * @param format - The expected format of the date in the filename
   * @returns Object with the extracted date and the remaining name, or null if no date found
   */
  static extractDateFromFilename(
    filename: string,
    format: DateFormatPattern
  ): { date: Date; remainingName: string } | null {
    // Determine the expected length of the date based on format
    const formatLength = format.replace(/-/g, '').length;

    // Determine regex patterns based on format length
    let datePatternRegex: RegExp;
    let endDatePatternRegex: RegExp;

    if (formatLength === 8) {
      // Full date with 4-digit year (YYYYMMDD, DD-MM-YYYY, etc.)
      datePatternRegex = /^(\d{8}|\d{4}[-_.]\d{2}[-_.]\d{2}|\d{2}[-_.]\d{2}[-_.]\d{4})/;
      endDatePatternRegex = /(\d{8}|\d{4}[-_.]\d{2}[-_.]\d{2}|\d{2}[-_.]\d{2}[-_.]\d{4})$/;
    } else if (formatLength === 6) {
      // Full date with 2-digit year or year-month with 4-digit year (YYMMDD, YYYYMM, etc.)
      datePatternRegex = /^(\d{6}|\d{2}[-_.]\d{2}[-_.]\d{2}|\d{4}[-_.]\d{2}|\d{2}[-_.]\d{4})/;
      endDatePatternRegex = /(\d{6}|\d{2}[-_.]\d{2}[-_.]\d{2}|\d{4}[-_.]\d{2}|\d{2}[-_.]\d{4})$/;
    } else if (formatLength === 4) {
      // Year-month with 2-digit year (YYMM, MMYY, etc.)
      datePatternRegex = /^(\d{4}|\d{2}[-_.]\d{2})/;
      endDatePatternRegex = /(\d{4}|\d{2}[-_.]\d{2})$/;
    } else {
      return null;
    }

    // Try to find a date pattern in the filename
    // First, try at the beginning
    let match = filename.match(datePatternRegex);
    let dateStr: string | null = null;
    let remainingName: string = filename;

    if (match && match[1]) {
      dateStr = match[1];
      remainingName = filename.slice(match[0].length).replace(/^[-_.\s]+/, '');
    } else {
      // Try at the end
      match = filename.match(endDatePatternRegex);
      if (match && match[1] && match.index !== undefined) {
        dateStr = match[1];
        remainingName = filename.slice(0, match.index).replace(/[-_.\s]+$/, '');
      }
    }

    if (!dateStr) {
      return null;
    }

    const date = this.parseDate(dateStr, format);
    if (!date) {
      return null;
    }

    return { date, remainingName };
  }

  /**
   * Detect the date format from a list of filenames
   * Tries each format and returns the one that successfully parses the most files
   * @param filenames - Array of filenames to analyze
   * @returns The detected date format or null if no format matches
   */
  static detectDateFormat(filenames: string[]): DateFormatPattern | null {
    if (filenames.length === 0) return null;

    // Remove extensions from filenames
    const namesWithoutExt = filenames.map((name) => {
      const lastDotIndex = name.lastIndexOf('.');
      return lastDotIndex > 0 ? name.slice(0, lastDotIndex) : name;
    });

    // Track how many files each format successfully parses
    const formatScores: { format: DateFormatPattern; score: number }[] = [];

    for (const formatInfo of this.DATE_FORMATS) {
      let matchCount = 0;

      for (const name of namesWithoutExt) {
        const result = this.extractDateFromFilename(name, formatInfo.value);
        if (result && result.date) {
          // Validate the date is reasonable (between 1990 and 2100)
          const year = result.date.getFullYear();
          if (year >= 1990 && year <= 2100) {
            matchCount++;
          }
        }
      }

      if (matchCount > 0) {
        formatScores.push({ format: formatInfo.value, score: matchCount });
      }
    }

    // Sort by score (highest first) and return the best match
    formatScores.sort((a, b) => b.score - a.score);

    // Return the format with the highest score, or null if none matched
    return formatScores.length > 0 ? (formatScores[0]?.format ?? null) : null;
  }

  /**
   * Get today's date
   * @returns Today's date
   */
  static today(): Date {
    return new Date();
  }
}
