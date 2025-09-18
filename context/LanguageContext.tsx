import React, { createContext, useState, useEffect, useContext } from 'react';

type Language = 'ar' | 'fr';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  translations: Record<string, string>;
  // FIX: Update the 't' function signature to accept an optional 'options' object for interpolation and a `forceLang` override.
  t: (key: string, options?: { [key: string]: string | number }, forceLang?: Language) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');
  const [translationsData, setTranslationsData] = useState<Record<Language, Record<string, string>>>({ ar: {}, fr: {} });

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [arResponse, frResponse] = await Promise.all([
          fetch('./locales/ar.json'),
          fetch('./locales/fr.json')
        ]);
        const ar = await arResponse.json();
        const fr = await frResponse.json();
        setTranslationsData({ ar, fr });
      } catch (error) {
        console.error("Failed to load translation files", error);
      }
    };
    fetchTranslations();
  }, []); // Run only once

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  // FIX: Update the 't' function to handle an optional `forceLang` parameter to override the current language.
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
    <LanguageContext.Provider value={{ language, changeLanguage, translations: translationsData[language] || {}, t }}>
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
