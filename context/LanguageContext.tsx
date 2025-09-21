import React, { createContext, useState, useEffect, useContext } from 'react';

// Import translations directly to prevent race conditions
import arTranslations from '../locales/ar.json';
import frTranslations from '../locales/fr.json';

type Language = 'ar' | 'fr';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }, forceLang?: Language) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// The loaded translations can be stored in a constant outside the component
const translationsData = {
  ar: arTranslations as Record<string, string>,
  fr: frTranslations as Record<string, string>,
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  const t = (key: string, options?: { [key: string]: string | number }, forceLang?: Language): string => {
    const langToUse = forceLang || language;
    const langTranslations = translationsData[langToUse];
    let translation = langTranslations?.[key] || key;

    if (options && translation) {
        Object.entries(options).forEach(([optionKey, value]) => {
            const regex = new RegExp(`{${optionKey}}`, 'g');
            translation = translation.replace(regex, String(value));
        });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useTranslation must be used within a LanguageProvider');
    }
    return context;
};