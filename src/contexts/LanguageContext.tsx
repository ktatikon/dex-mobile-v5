import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { languages } from '@/services/i18nService';

interface LanguageContextType {
  currentLanguage: string;
  availableLanguages: typeof languages;
  changeLanguage: (languageCode: string) => Promise<void>;
  isRTL: boolean;
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextType>({} as LanguageContextType);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const { i18n } = useTranslation();
  const [loading, setLoading] = useState(false);

  // RTL languages (add more as needed)
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  const isRTL = rtlLanguages.includes(i18n.language);

  const changeLanguage = async (languageCode: string) => {
    setLoading(true);
    try {
      await i18n.changeLanguage(languageCode);
      
      // Store language preference
      localStorage.setItem('dex-mobile-language', languageCode);
      
      // Update document direction for RTL languages
      document.documentElement.dir = rtlLanguages.includes(languageCode) ? 'rtl' : 'ltr';
      document.documentElement.lang = languageCode;
      
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('dex-mobile-language');
    if (savedLanguage && savedLanguage !== i18n.language) {
      changeLanguage(savedLanguage);
    }
    
    // Set initial document direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, []);

  return (
    <LanguageContext.Provider value={{
      currentLanguage: i18n.language,
      availableLanguages: languages,
      changeLanguage,
      isRTL,
      loading
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
