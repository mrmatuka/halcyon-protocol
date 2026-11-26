import { createContext, useContext } from 'react';
import type { Locale } from './adventure';

export const Language = createContext<Locale>('hu');
export function useLanguage() {
  const locale = useContext(Language);
  return { locale, t: (hu: string, en: string) => (locale === 'en' ? en : hu) };
}
