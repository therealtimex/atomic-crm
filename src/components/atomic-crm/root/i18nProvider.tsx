import { mergeTranslations } from "ra-core";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import frenchMessages from "ra-language-french";
import spanishMessages from "ra-language-spanish";
import japaneseMessages from "ra-language-japanese";
import koreanMessages from "ra-language-korean";
import vietnameseMessages from "ra-language-vietnamese";
import { raSupabaseEnglishMessages } from "ra-supabase-language-english";
import { enMessages } from "@/i18n/en";
import { frMessages } from "@/i18n/fr";
import { esMessages } from "@/i18n/es";
import { viMessages } from "@/i18n/vi";
import { jaMessages } from "@/i18n/ja";
import { koMessages } from "@/i18n/ko";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, normalizeLocale } from "@/i18n/locales";

const raSupabaseEnglishMessagesOverride = {
  "ra-supabase": {
    auth: {
      password_reset: "Check your emails for a Reset Password message.",
    },
  },
};

const raSupabaseMessages = mergeTranslations(
  raSupabaseEnglishMessages,
  raSupabaseEnglishMessagesOverride,
);

const messages = {
  en: mergeTranslations(englishMessages, raSupabaseMessages, enMessages),
  fr: mergeTranslations(frenchMessages, raSupabaseMessages, frMessages),
  es: mergeTranslations(spanishMessages, raSupabaseMessages, esMessages),
  vi: mergeTranslations(vietnameseMessages, raSupabaseMessages, viMessages),
  ja: mergeTranslations(japaneseMessages, raSupabaseMessages, jaMessages),
  ko: mergeTranslations(koreanMessages, raSupabaseMessages, koMessages),
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
