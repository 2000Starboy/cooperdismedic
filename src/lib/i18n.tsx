// ============================================================================
// i18n System — Lightweight React Context for FR/EN/AR with RTL support
// ============================================================================

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

import fr from '@/data/translations/fr.json';
import en from '@/data/translations/en.json';
import ar from '@/data/translations/ar.json';

// ============================================================================
// Types
// ============================================================================
export type Locale = 'fr' | 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

type TranslationData = typeof fr;

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K
      : never
    }[keyof T]
  : never;

// Allow any dotted string key for flexibility
type TranslationKey = string;

interface I18nContextValue {
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  tArray: (key: TranslationKey) => string[];
}

// ============================================================================
// Translation map
// ============================================================================
const translations: Record<Locale, TranslationData> = { fr, en, ar };

const directionMap: Record<Locale, Direction> = {
  fr: 'ltr',
  en: 'ltr',
  ar: 'rtl',
};

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  ar: '🇲🇦',
};

// ============================================================================
// Helper: deep access by dotted key
// ============================================================================
function getNestedValue(obj: unknown, path: string): string | undefined {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === 'string' ? current : undefined;
}

// Helper: deep access for any type (arrays, objects, strings)
function getNestedRaw(obj: unknown, path: string): unknown {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

// ============================================================================
// Context
// ============================================================================
const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================
export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('cooperdismedic_lang') as Locale | null;
      if (stored && translations[stored]) return stored;
    }
    return 'fr';
  });

  const dir = directionMap[locale];

  // Apply locale to document
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;

    // Update font family for Arabic
    if (locale === 'ar') {
      document.documentElement.classList.add('locale-ar');
      document.documentElement.classList.remove('locale-fr', 'locale-en');
    } else {
      document.documentElement.classList.remove('locale-ar');
      document.documentElement.classList.add(`locale-${locale}`);
    }

    // Update page title
    const title = getNestedValue(translations[locale], 'meta.title');
    if (title) document.title = title;
  }, [locale, dir]);

  const setLocale = useCallback((newLocale: Locale) => {
    if (translations[newLocale]) {
      setLocaleState(newLocale);
      localStorage.setItem('cooperdismedic_lang', newLocale);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      // Use !== undefined so that empty-string values ("") are returned as-is
      // instead of falling through to the raw key (which is always truthy).
      const value = getNestedValue(translations[locale], key);
      if (value !== undefined) return value;

      // Fallback to French
      if (locale !== 'fr') {
        const frValue = getNestedValue(translations.fr, key);
        if (frValue !== undefined) return frValue;
      }

      return fallback ?? key;
    },
    [locale]
  );

  const tArray = useCallback(
    (key: TranslationKey): string[] => {
      const value = getNestedRaw(translations[locale], key);
      if (Array.isArray(value)) return value;

      // Fallback to French
      if (locale !== 'fr') {
        const frValue = getNestedRaw(translations.fr, key);
        if (Array.isArray(frValue)) return frValue;
      }

      return [];
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, dir, setLocale, t, tArray }}>
      {children}
    </I18nContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================
export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}

// ============================================================================
// Utility: check if current locale is RTL
// ============================================================================
export function useIsRTL(): boolean {
  const { dir } = useTranslation();
  return dir === 'rtl';
}
