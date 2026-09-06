import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider as AppThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

function RootLayoutNav() {
  const { theme } = useTheme();

  return (
    <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="otp" options={{ headerShown: false }} />
          <Stack.Screen name="kabadiwala" options={{ headerShown: false }} />
          <Stack.Screen name="recycler" options={{ headerShown: false }} />
          <Stack.Screen name="scan" options={{ headerShown: false }} />
          <Stack.Screen name="scan-result" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="auto" />
      </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <LanguageProvider>
      <AppThemeProvider>
        <RootLayoutNav />
      </AppThemeProvider>
    </LanguageProvider>
  );
}

