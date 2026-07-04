'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { locales, defaultLocale, type Locale } from './locales';

export { locales, type Locale };

type LocaleContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  locales: readonly Locale[];
};

const LocaleContext = createContext<LocaleContextType>({
  locale: defaultLocale,
  setLocale: () => {},
  locales,
});

export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: string }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('acert_locale') : null;
    if (stored && (locales as readonly string[]).includes(stored)) {
      setLocaleState(stored as Locale);
      document.documentElement.lang = stored;
    }
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('acert_locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <LocaleContext.Provider value={{ locale, setLocale, locales }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
