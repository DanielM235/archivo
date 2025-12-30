import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { RenameConfigForm } from './RenameConfigForm';
import type { IRenameConfig } from '@archivo/shared';

// Wrapper component with theme
const renderWithTheme = (ui: React.ReactElement) => {
  const theme = createTheme();
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
};

describe('RenameConfigForm', () => {
  const defaultConfig: IRenameConfig = {
    sourceDateFormat: 'YYYYMMDD',
    targetDateFormat: 'YYMMDD',
    nameOrder: 'date-name',
    separator: '_',
  };

  // ============================================
  // Rendering
  // ============================================
  describe('rendering', () => {
    it('should render the form title', () => {
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={vi.fn()} />);

      expect(screen.getByText('Rename Configuration')).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={vi.fn()} />);

      expect(screen.getByLabelText(/Source Date Format/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Target Date Format/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Name Order/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Separator/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Custom Name/i)).toBeInTheDocument();
    });

    it('should render output preview', () => {
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={vi.fn()} />);

      expect(screen.getByText('Output Preview')).toBeInTheDocument();
    });

    it('should show helper text for custom name field', () => {
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={vi.fn()} />);

      expect(screen.getByText(/Only letters.*numbers.*underscore/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Custom Name Validation
  // ============================================
  describe('custom name validation', () => {
    it('should not show error for valid characters', () => {
      renderWithTheme(
        <RenameConfigForm
          config={{ ...defaultConfig, customName: 'ValidName123' }}
          onConfigChange={vi.fn()}
        />
      );

      // Should show the helper text, not an error
      expect(
        screen.getByText(/Only letters.*numbers.*underscore.*hyphen.*space are allowed/i)
      ).toBeInTheDocument();
    });

    it('should show error for name with dot', () => {
      renderWithTheme(
        <RenameConfigForm
          config={{ ...defaultConfig, customName: 'file.name' }}
          onConfigChange={vi.fn()}
        />
      );

      // Error message should be displayed
      const errorText = screen.getByText(/Only letters, numbers/i);
      expect(errorText).toBeInTheDocument();
    });

    it('should show error for leading space', () => {
      renderWithTheme(
        <RenameConfigForm
          config={{ ...defaultConfig, customName: ' leadingSpace' }}
          onConfigChange={vi.fn()}
        />
      );

      expect(screen.getByText(/start or end with a space/i)).toBeInTheDocument();
    });

    it('should show error for consecutive spaces', () => {
      renderWithTheme(
        <RenameConfigForm
          config={{ ...defaultConfig, customName: 'double  space' }}
          onConfigChange={vi.fn()}
        />
      );

      expect(screen.getByText(/consecutive spaces/i)).toBeInTheDocument();
    });
  });

  // ============================================
  // Disabled State
  // ============================================
  describe('disabled state', () => {
    it('should disable custom name field when disabled prop is true', () => {
      renderWithTheme(
        <RenameConfigForm config={defaultConfig} onConfigChange={vi.fn()} disabled={true} />
      );

      const customNameInput = screen.getByLabelText(/Custom Name/i);
      expect(customNameInput).toBeDisabled();
    });
  });

  // ============================================
  // Config Changes
  // ============================================
  describe('config changes', () => {
    it('should call onConfigChange when source format is changed', () => {
      const onConfigChange = vi.fn();
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={onConfigChange} />);

      // Find the source format select
      const sourceFormatSelect = screen.getByLabelText(/Source Date Format/i);
      fireEvent.mouseDown(sourceFormatSelect);

      // Select a different option
      const option = screen.getByRole('option', { name: /YYMMDD \(251230\)/i });
      fireEvent.click(option);

      expect(onConfigChange).toHaveBeenCalledWith({
        ...defaultConfig,
        sourceDateFormat: 'YYMMDD',
      });
    });

    it('should call onConfigChange when target format is changed', () => {
      const onConfigChange = vi.fn();
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={onConfigChange} />);

      const targetFormatSelect = screen.getByLabelText(/Target Date Format/i);
      fireEvent.mouseDown(targetFormatSelect);

      const option = screen.getByRole('option', { name: /YYYYMMDD \(20251230\)/i });
      fireEvent.click(option);

      expect(onConfigChange).toHaveBeenCalledWith({
        ...defaultConfig,
        targetDateFormat: 'YYYYMMDD',
      });
    });

    it('should call onConfigChange when name order is changed', () => {
      const onConfigChange = vi.fn();
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={onConfigChange} />);

      const nameOrderSelect = screen.getByLabelText(/Name Order/i);
      fireEvent.mouseDown(nameOrderSelect);

      const option = screen.getByRole('option', { name: /Name first/i });
      fireEvent.click(option);

      expect(onConfigChange).toHaveBeenCalledWith({
        ...defaultConfig,
        nameOrder: 'name-date',
      });
    });

    it('should call onConfigChange when separator is changed', () => {
      const onConfigChange = vi.fn();
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={onConfigChange} />);

      const separatorSelect = screen.getByLabelText(/Separator/i);
      fireEvent.mouseDown(separatorSelect);

      const option = screen.getByRole('option', { name: /Hyphen/i });
      fireEvent.click(option);

      expect(onConfigChange).toHaveBeenCalledWith({
        ...defaultConfig,
        separator: '-',
      });
    });

    it('should call onConfigChange when custom name is changed', () => {
      const onConfigChange = vi.fn();
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={onConfigChange} />);

      const customNameInput = screen.getByLabelText(/Custom Name/i);
      fireEvent.change(customNameInput, { target: { value: 'NewName' } });

      expect(onConfigChange).toHaveBeenCalledWith({
        ...defaultConfig,
        customName: 'NewName',
      });
    });
  });

  // ============================================
  // Preview
  // ============================================
  describe('preview', () => {
    it('should show preview with custom name', () => {
      renderWithTheme(
        <RenameConfigForm
          config={{ ...defaultConfig, customName: 'MyDoc' }}
          onConfigChange={vi.fn()}
        />
      );

      // Preview should contain the custom name
      const preview = screen.getByText(/MyDoc\.ext/);
      expect(preview).toBeInTheDocument();
    });

    it('should show preview with example when no custom name', () => {
      renderWithTheme(<RenameConfigForm config={defaultConfig} onConfigChange={vi.fn()} />);

      // Preview should contain 'example'
      const preview = screen.getByText(/example\.ext/);
      expect(preview).toBeInTheDocument();
    });

    it('should not use invalid custom name in preview', () => {
      renderWithTheme(
        <RenameConfigForm
          config={{ ...defaultConfig, customName: 'Invalid@Name' }}
          onConfigChange={vi.fn()}
        />
      );

      // Preview should show 'example' instead of invalid name
      const preview = screen.getByText(/example\.ext/);
      expect(preview).toBeInTheDocument();
    });
  });
});
