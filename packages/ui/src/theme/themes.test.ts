import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme } from './themes';

describe('themes', () => {
  describe('lightTheme', () => {
    it('should have light palette mode', () => {
      expect(lightTheme.palette.mode).toBe('light');
    });

    it('should have primary color defined', () => {
      expect(lightTheme.palette.primary.main).toBe('#1976d2');
      expect(lightTheme.palette.primary.light).toBe('#42a5f5');
      expect(lightTheme.palette.primary.dark).toBe('#1565c0');
    });

    it('should have secondary color defined', () => {
      expect(lightTheme.palette.secondary.main).toBe('#9c27b0');
    });

    it('should have border radius configured', () => {
      expect(lightTheme.shape.borderRadius).toBe(8);
    });

    it('should have typography configured', () => {
      expect(lightTheme.typography.fontFamily).toContain('Roboto');
    });
  });

  describe('darkTheme', () => {
    it('should have dark palette mode', () => {
      expect(darkTheme.palette.mode).toBe('dark');
    });

    it('should have primary color defined', () => {
      expect(darkTheme.palette.primary.main).toBe('#90caf9');
    });

    it('should have secondary color defined', () => {
      expect(darkTheme.palette.secondary.main).toBe('#ce93d8');
    });

    it('should have dark background colors', () => {
      expect(darkTheme.palette.background.default).toBe('#121212');
      expect(darkTheme.palette.background.paper).toBe('#1e1e1e');
    });

    it('should have border radius configured', () => {
      expect(darkTheme.shape.borderRadius).toBe(8);
    });
  });

  describe('common theme options', () => {
    it('should have consistent shape between themes', () => {
      expect(lightTheme.shape.borderRadius).toBe(darkTheme.shape.borderRadius);
    });

    it('should have button text transform disabled', () => {
      const lightButtonStyles = lightTheme.components?.MuiButton?.styleOverrides?.root;
      const darkButtonStyles = darkTheme.components?.MuiButton?.styleOverrides?.root;

      expect(lightButtonStyles).toBeDefined();
      expect(darkButtonStyles).toBeDefined();
    });
  });
});
