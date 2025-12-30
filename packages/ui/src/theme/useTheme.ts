import { useContext } from 'react';
import { ThemeContext, type IThemeContextValue } from './ThemeContext';

/**
 * Hook to access theme context
 * @returns Theme context value with mode and toggle function
 */
export const useTheme = (): IThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
