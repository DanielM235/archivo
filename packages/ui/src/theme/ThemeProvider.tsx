import { type FC, type ReactNode, useMemo, useState, useCallback } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from './themes';
import { ThemeContext, type ThemeMode } from './ThemeContext';

/**
 * Props for ThemeProvider component
 */
interface IThemeProviderProps {
  children: ReactNode;
  defaultMode?: ThemeMode;
}

/**
 * Theme provider component that wraps the application with MUI theme
 * Provides light/dark mode toggle functionality
 */
export const ThemeProvider: FC<IThemeProviderProps> = ({ children, defaultMode = 'light' }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check for saved preference in localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('archivo-theme-mode') as ThemeMode | null;
      if (saved === 'light' || saved === 'dark') {
        return saved;
      }
      // Check system preference
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    }
    return defaultMode;
  });

  const toggleTheme = useCallback(() => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('archivo-theme-mode', newMode);
      return newMode;
    });
  }, []);

  const setTheme = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('archivo-theme-mode', newMode);
  }, []);

  const theme = useMemo(() => (mode === 'light' ? lightTheme : darkTheme), [mode]);

  const contextValue = useMemo(
    () => ({
      mode,
      toggleTheme,
      setTheme,
    }),
    [mode, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
