import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';
type AppRole = 'kabadiwala' | 'recycler' | 'none';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  appRole: AppRole;
  setAppRole: (role: AppRole) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useDeviceColorScheme() || 'light';
  const [theme, setTheme] = useState<ThemeMode>(deviceTheme);
  const [appRole, setAppRole] = useState<AppRole>('none');

  useEffect(() => {
    // Load saved theme
    AsyncStorage.getItem('@app_theme').then((savedTheme) => {
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    AsyncStorage.setItem('@app_theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, appRole, setAppRole }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
