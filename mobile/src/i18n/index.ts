import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { en, bn, StringKey } from './strings';

export type Language = 'en' | 'bn';

const LANGUAGE_KEY = 'obhoy_language';
const TABLES: Record<Language, Partial<Record<StringKey, string>>> = { en, bn };

let currentLanguage: Language = 'en';
const listeners = new Set<(lang: Language) => void>();

export function getLanguage(): Language {
  return currentLanguage;
}

/**
 * Reads the stored language into module state.
 * Returns null if the user has never chosen one -> show the first-run picker.
 * MUST be awaited in any background task before calling t().
 */
export async function loadLanguage(): Promise<Language | null> {
  try {
    const stored = await SecureStore.getItemAsync(LANGUAGE_KEY);
    if (stored === 'en' || stored === 'bn') {
      currentLanguage = stored;
      return stored;
    }
  } catch {
    // fall through to the default
  }
  return null;
}

export async function setLanguage(lang: Language): Promise<void> {
  currentLanguage = lang;
  try {
    await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
  } catch {
    // keep the in-memory value even if persistence fails
  }
  listeners.forEach((fn) => fn(lang));
}

export function subscribeToLanguage(fn: (lang: Language) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const table = TABLES[currentLanguage];
  let out: string = table[key] ?? en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{{${name}}}`).join(String(value));
    }
  }
  return out;
}

/**
 * Only needed so a screen re-renders when the language changes.
 * The returned value is usually ignored - t() reads module state directly.
 */
export function useLanguage(): Language {
  const [lang, setLang] = useState<Language>(currentLanguage);
  useEffect(() => subscribeToLanguage(setLang), []);
  return lang;
}