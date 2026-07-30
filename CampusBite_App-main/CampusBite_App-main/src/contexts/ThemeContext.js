import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS as LIGHT_COLORS, DARK_COLORS } from '../constants';

const STORAGE_KEY = 'campusbite_theme_mode';

// Dark mode now applies to every role (and the pre-login landing/auth
// screens), so the preference is a single device-wide setting — there's no
// per-role leak concern anymore since every screen respects it the same way.

const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === 'dark' || saved === 'light') setMode(saved);
    });
  }, []);

  const setThemeMode = useCallback((next) => {
    setMode(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(() => ({
    mode,
    isDark: mode === 'dark',
    colors: mode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    toggleTheme,
    setThemeMode,
  }), [mode, toggleTheme, setThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
