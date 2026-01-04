import { useEffect, useRef } from "react";
import { useGetIdentity, useLocaleState } from "ra-core";
import { getSupabaseConfig } from "@/lib/supabase-config";
import { supabase } from "../providers/supabase/supabase";
import { resolveLocale } from "@/i18n/locales";

type IdentityWithLocale = {
  id?: string | number;
  locale?: string | null;
};

export const LocaleSync = () => {
  const { data: identity, isPending } = useGetIdentity();
  const [locale, setLocale] = useLocaleState();
  const lastPersistedLocale = useRef<string | null>(null);
  const hasInitialized = useRef(false);
  const lastIdentityId = useRef<IdentityWithLocale["id"] | null>(null);
  const supabaseConfig = getSupabaseConfig();
  const supabaseConfigured = Boolean(supabaseConfig);
  const storeKey = "RaStoreCRM.locale";

  useEffect(() => {
    if (isPending) return;

    const identityData = identity as IdentityWithLocale | undefined;
    const identityLocale = identityData?.locale;
    const identityId = identityData?.id ?? null;
    if (hasInitialized.current && identityId === lastIdentityId.current) {
      return;
    }
    const storedLocale = (() => {
      if (typeof window === "undefined") return null;
      try {
        const stored = window.localStorage.getItem(storeKey);
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        if (typeof parsed === "string") {
          return resolveLocale([parsed]);
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

    if (!identityLocale && identityId != null) {
      const persistInitialLocale = async () => {
        try {
          if (!supabaseConfigured) return;
          const { error } = await supabase.rpc("set_sales_locale", {
            new_locale: nextLocale,
          });
          if (error) throw error;
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
    lastIdentityId.current = identityId;
  }, [identity, isPending, locale, setLocale, supabaseConfigured]);

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (!identity?.id) return;
    if (!locale) return;
    if (lastPersistedLocale.current === locale) return;

    const persistLocale = async () => {
      try {
        if (!supabaseConfigured) return;
        const { error } = await supabase.rpc("set_sales_locale", {
          new_locale: locale,
        });
        if (error) throw error;
        lastPersistedLocale.current = locale;
      } catch (error) {
        console.error("[i18n] Failed to persist locale change", error);
      }
    };

    void persistLocale();
  }, [identity, locale, supabaseConfigured]);

  return null;
};
