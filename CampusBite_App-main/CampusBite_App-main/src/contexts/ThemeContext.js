import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS as LIGHT_COLORS, DARK_COLORS } from '../constants';
import useAuthStore from '../stores/authStore';

const STORAGE_KEY = 'campusbite_theme_mode';

// Dark mode is currently a consumer-only feature — the toggle only appears
// on the consumer's Profile screen. Gating here (not just hiding the UI)
// means a preference saved during a consumer session can't leak into
// another role's screens if a different account signs in on the same
// device, since AsyncStorage is shared across accounts, not per-user.
const DARK_MODE_ROLES = ['consumer'];

const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  colors: LIGHT_COLORS,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');
  const userRole = useAuthStore((s) => s.user?.role);
  const allowDarkMode = DARK_MODE_ROLES.includes(userRole);

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

  const effectiveMode = allowDarkMode ? mode : 'light';

  const value = useMemo(() => ({
    mode: effectiveMode,
    isDark: effectiveMode === 'dark',
    colors: effectiveMode === 'dark' ? DARK_COLORS : LIGHT_COLORS,
    toggleTheme,
    setThemeMode,
  }), [effectiveMode, toggleTheme, setThemeMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
