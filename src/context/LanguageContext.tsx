import React, { createContext, useContext, useState, ReactNode } from 'react';

// Fix: Add 'ar' to support Arabic language
type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Fix: Add more complete translations for all languages
const translations: Record<Language, Record<string, string>> = {
    en: {
        greeting: 'Hello',
        invoices: 'Invoices',
        inventory: 'Inventory',
        profile: 'Profile',
        welcomeMessage: 'Welcome, {username}',
        logout: 'Logout',
    },
    fr: {
        greeting: 'Bonjour',
        invoices: 'Factures',
        inventory: 'Inventaire',
        profile: 'Profil',
        welcomeMessage: 'Bienvenue, {username}',
        logout: 'Déconnexion',
    },
    ar: {
        greeting: 'مرحبا',
        invoices: 'الفواتير',
        inventory: 'المخزون',
        profile: 'الملف الشخصي',
        welcomeMessage: 'مرحباً، {username}',
        logout: 'تسجيل الخروج',
    },
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  
  const t = (key: string): string => {
      return translations[language][key] || key;
  }

  const value = { language, setLanguage, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
