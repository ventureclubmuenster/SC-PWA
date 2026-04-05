'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { translations, type Locale, type TranslationKeys } from './translations';

type LanguageContextType = {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextType | null>(null);

function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'de';

  // Check localStorage override first
  const stored = localStorage.getItem('app_locale');
  if (stored === 'de' || stored === 'en') return stored;

  // Detect from system language
  const lang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'de';
  return lang.startsWith('de') ? 'de' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('de');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('app_locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  // Use detected locale after mount, fallback to 'de' for SSR
  const activeLocale = mounted ? locale : 'de';
  const t = translations[activeLocale];

  return (
    <LanguageContext.Provider value={{ locale: activeLocale, t, setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Fallback for components outside provider (e.g. during SSR)
    return {
      locale: 'de' as Locale,
      t: translations.de,
      setLocale: () => {},
    };
  }
  return ctx;
}

export { type Locale, type TranslationKeys };
