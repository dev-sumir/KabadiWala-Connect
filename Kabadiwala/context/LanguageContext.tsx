import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'hi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'hi',
  setLanguage: () => {},
  toggleLanguage: () => {},
});

const STORAGE_KEY = '@app_language_preference';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('hi');

  useEffect(() => {
    // Load persisted language choice on app startup
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'hi' || saved === 'en') {
          setLanguageState(saved);
        }
      })
      .catch((err) => {
        console.warn('Could not load saved language preference:', err);
      });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang).catch((err) => {
      console.warn('Could not persist language preference:', err);
    });
  };

  const toggleLanguage = () => {
    const nextLang = language === 'hi' ? 'en' : 'hi';
    setLanguage(nextLang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
