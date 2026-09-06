import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useLanguage } from '@/context/LanguageContext';

interface LanguageToggleProps {
  themeVariant?: 'light' | 'dark';
}

export function LanguageToggle({ themeVariant = 'light' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();
  const isDark = themeVariant === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <TouchableOpacity
        style={[
          styles.toggleBtn,
          language === 'en' && (isDark ? styles.btnActiveDark : styles.btnActiveLight),
        ]}
        onPress={() => setLanguage('en')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.toggleText,
            isDark ? styles.textDark : styles.textLight,
            language === 'en' && styles.textActive,
          ]}
        >
          EN
        </Text>
      </TouchableOpacity>

      <View style={[styles.separator, isDark ? styles.separatorDark : styles.separatorLight]} />

      <TouchableOpacity
        style={[
          styles.toggleBtn,
          language === 'hi' && (isDark ? styles.btnActiveDark : styles.btnActiveLight),
        ]}
        onPress={() => setLanguage('hi')}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.toggleText,
            isDark ? styles.textDark : styles.textLight,
            language === 'hi' && styles.textActive,
          ]}
        >
          अ
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 2,
    height: 32,
  },
  containerLight: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  containerDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActiveLight: {
    backgroundColor: '#15803D',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 2,
  },
  btnActiveDark: {
    backgroundColor: '#16A34A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  separator: {
    width: 1,
    height: 12,
    marginHorizontal: 1,
  },
  separatorLight: {
    backgroundColor: '#CBD5E1',
  },
  separatorDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textLight: {
    color: '#64748B',
  },
  textDark: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
