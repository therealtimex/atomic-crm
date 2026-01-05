import { enUS, es, fr, ja, ko, vi } from "date-fns/locale";
import { DEFAULT_LOCALE, normalizeLocale } from "./locales";

const localeMap: Record<string, Locale> = {
  en: enUS,
  es,
  fr,
  ja,
  ko,
  vi,
};

export const getDateFnsLocale = (locale?: string): Locale => {
  const normalized = normalizeLocale(locale || DEFAULT_LOCALE);
  return localeMap[normalized] ?? enUS;
};
