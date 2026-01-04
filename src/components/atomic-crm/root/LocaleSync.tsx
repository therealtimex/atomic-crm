import { useEffect, useRef } from "react";
import { useDataProvider, useGetIdentity, useLocaleState } from "ra-core";
import { resolveLocale } from "@/i18n/locales";

type IdentityWithLocale = {
  id?: string | number;
  locale?: string | null;
};

export const LocaleSync = () => {
  const dataProvider = useDataProvider();
  const { data: identity, isPending } = useGetIdentity();
  const [locale, setLocale] = useLocaleState();
  const lastPersistedLocale = useRef<string | null>(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isPending) return;

    const identityLocale = (identity as IdentityWithLocale | undefined)?.locale;
    const storedLocale = (() => {
      if (typeof window === "undefined") return null;
      try {
        const stored = window.localStorage.getItem("CRM");
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        if (typeof parsed?.locale === "string") {
          return resolveLocale([parsed.locale]);
        }
      } catch {
        return null;
      }
      return null;
    })();
    const detectedLocale = resolveLocale(
      typeof navigator !== "undefined" ? navigator.languages : undefined,
    );
    const nextLocale = identityLocale || storedLocale || detectedLocale;

    if (nextLocale && nextLocale !== locale) {
      setLocale(nextLocale);
    }

    if (!identityLocale && identity?.id != null) {
      const persistInitialLocale = async () => {
        try {
          await dataProvider.update("sales", {
            id: identity.id,
            data: { locale: nextLocale },
            previousData: identity,
          });
          lastPersistedLocale.current = nextLocale;
        } catch (error) {
          console.error("[i18n] Failed to persist initial locale", error);
        }
      };
      void persistInitialLocale();
    } else {
      lastPersistedLocale.current = identityLocale ?? nextLocale;
    }

    hasInitialized.current = true;
  }, [dataProvider, identity, isPending, locale, setLocale]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (!identity?.id) return;
    if (!locale) return;
    if (lastPersistedLocale.current === locale) return;

    const persistLocale = async () => {
      try {
        await dataProvider.update("sales", {
          id: identity.id,
          data: { locale },
          previousData: identity,
        });
        lastPersistedLocale.current = locale;
      } catch (error) {
        console.error("[i18n] Failed to persist locale change", error);
      }
    };

    void persistLocale();
  }, [dataProvider, identity, locale]);

  return null;
};
