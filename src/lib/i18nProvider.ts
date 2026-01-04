import { mergeTranslations } from "ra-core";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import frenchMessages from "ra-language-french";
import spanishMessages from "ra-language-spanish";
import japaneseMessages from "ra-language-japanese";
import koreanMessages from "ra-language-korean";
import vietnameseMessages from "ra-language-vietnamese";
import { enMessages } from "@/i18n/en";
import { frMessages } from "@/i18n/fr";
import { esMessages } from "@/i18n/es";
import { viMessages } from "@/i18n/vi";
import { jaMessages } from "@/i18n/ja";
import { koMessages } from "@/i18n/ko";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, normalizeLocale } from "@/i18n/locales";

const baseMessages = mergeTranslations(englishMessages, enMessages);

const messages = {
  en: baseMessages,
  fr: mergeTranslations(baseMessages, frenchMessages, frMessages),
  es: mergeTranslations(baseMessages, spanishMessages, esMessages),
  vi: mergeTranslations(baseMessages, vietnameseMessages, viMessages),
  ja: mergeTranslations(baseMessages, japaneseMessages, jaMessages),
  ko: mergeTranslations(baseMessages, koreanMessages, koMessages),
};

export const i18nProvider = polyglotI18nProvider(
  (locale) => {
    const normalized = normalizeLocale(locale);
    return messages[normalized as keyof typeof messages] || messages.en;
  },
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  { allowMissing: true },
);
