import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RENAME_CONFIG,
  SEPARATOR_OPTIONS,
  NAME_ORDER_OPTIONS,
  type IRenameConfig,
  type SeparatorType,
  type NameOrderType,
} from './IRenameConfig';

describe('IRenameConfig Constants', () => {
  // ============================================
  // DEFAULT_RENAME_CONFIG
  // ============================================
  describe('DEFAULT_RENAME_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_RENAME_CONFIG).toEqual({
        sourceDateFormat: 'YYYYMMDD',
        targetDateFormat: 'YYMMDD',
        nameOrder: 'date-name',
        separator: '_',
      });
    });

    it('should be a valid IRenameConfig', () => {
      const config: IRenameConfig = DEFAULT_RENAME_CONFIG;
      expect(config.sourceDateFormat).toBeDefined();
      expect(config.targetDateFormat).toBeDefined();
      expect(config.nameOrder).toBeDefined();
      expect(config.separator).toBeDefined();
    });

    it('should have valid date formats', () => {
      expect(typeof DEFAULT_RENAME_CONFIG.sourceDateFormat).toBe('string');
      expect(typeof DEFAULT_RENAME_CONFIG.targetDateFormat).toBe('string');
    });
  });

  // ============================================
  // SEPARATOR_OPTIONS
  // ============================================
  describe('SEPARATOR_OPTIONS', () => {
    it('should have 4 separator options', () => {
      expect(SEPARATOR_OPTIONS).toHaveLength(4);
    });

    it('should include underscore option', () => {
      const underscoreOption = SEPARATOR_OPTIONS.find((opt) => opt.value === '_');
      expect(underscoreOption).toBeDefined();
      expect(underscoreOption?.label).toBe('Underscore (_)');
    });

    it('should include hyphen option', () => {
      const hyphenOption = SEPARATOR_OPTIONS.find((opt) => opt.value === '-');
      expect(hyphenOption).toBeDefined();
      expect(hyphenOption?.label).toBe('Hyphen (-)');
    });

    it('should include space option', () => {
      const spaceOption = SEPARATOR_OPTIONS.find((opt) => opt.value === ' ');
      expect(spaceOption).toBeDefined();
      expect(spaceOption?.label).toBe('Space');
    });

    it('should include none option', () => {
      const noneOption = SEPARATOR_OPTIONS.find((opt) => opt.value === '');
      expect(noneOption).toBeDefined();
      expect(noneOption?.label).toBe('None');
    });

    it('should have value and label for each option', () => {
      SEPARATOR_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.label).toBe('string');
      });
    });

    it('should contain only valid SeparatorType values', () => {
      const validSeparators: SeparatorType[] = ['_', '-', ' ', ''];
      SEPARATOR_OPTIONS.forEach((option) => {
        expect(validSeparators).toContain(option.value);
      });
    });
  });

  // ============================================
  // NAME_ORDER_OPTIONS
  // ============================================
  describe('NAME_ORDER_OPTIONS', () => {
    it('should have 2 name order options', () => {
      expect(NAME_ORDER_OPTIONS).toHaveLength(2);
    });

    it('should include date-name option', () => {
      const dateNameOption = NAME_ORDER_OPTIONS.find((opt) => opt.value === 'date-name');
      expect(dateNameOption).toBeDefined();
      expect(dateNameOption?.label).toBe('Date first (YYMMDD_name)');
    });

    it('should include name-date option', () => {
      const nameDateOption = NAME_ORDER_OPTIONS.find((opt) => opt.value === 'name-date');
      expect(nameDateOption).toBeDefined();
      expect(nameDateOption?.label).toBe('Name first (name_YYMMDD)');
    });

    it('should have value and label for each option', () => {
      NAME_ORDER_OPTIONS.forEach((option) => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.label).toBe('string');
        expect(typeof option.value).toBe('string');
      });
    });

    it('should contain only valid NameOrderType values', () => {
      const validOrders: NameOrderType[] = ['date-name', 'name-date'];
      NAME_ORDER_OPTIONS.forEach((option) => {
        expect(validOrders).toContain(option.value);
      });
    });
  });
});
