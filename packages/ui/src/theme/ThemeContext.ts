import { createContext } from 'react';

/**
 * Theme mode type
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Theme context value interface
 */
export interface IThemeContextValue {
  mode: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

/**
 * Theme context for accessing theme mode and toggle function
 */
export const ThemeContext = createContext<IThemeContextValue | undefined>(undefined);
