export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = [
  { locale: "en", name: "English" },
  { locale: "fr", name: "Français" },
  { locale: "es", name: "Español" },
  { locale: "vi", name: "Tiếng Việt" },
  { locale: "ja", name: "日本語" },
  { locale: "ko", name: "한국어" },
];

const supportedLocaleSet = new Set(
  SUPPORTED_LOCALES.map((language) => language.locale),
);

export const normalizeLocale = (locale: string): string => {
  if (!locale) return DEFAULT_LOCALE;
  const normalized = locale.toLowerCase().replace("_", "-");
  if (supportedLocaleSet.has(normalized)) {
    return normalized;
  }
  const base = normalized.split("-")[0];
  if (supportedLocaleSet.has(base)) {
    return base;
  }
  return DEFAULT_LOCALE;
};

export const resolveLocale = (
  preferredLocales?: readonly string[] | null,
): string => {
  if (!preferredLocales?.length) return DEFAULT_LOCALE;
  for (const locale of preferredLocales) {
    const normalized = normalizeLocale(locale);
    if (supportedLocaleSet.has(normalized)) {
      return normalized;
    }
  }
  return DEFAULT_LOCALE;
};
