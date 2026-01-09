import { useEffect, useRef } from "react";
import { useGetIdentity, useLocaleState } from "ra-core";
import { getSupabaseConfig } from "@/lib/supabase-config";
import { supabase } from "../providers/supabase/supabase";
import { updateCachedSaleLocale } from "../providers/supabase/authProvider";
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
  const pendingPersistLocale = useRef<string | null>(null);
  const supabaseConfig = getSupabaseConfig();
  const supabaseConfigured = Boolean(supabaseConfig);
  const storeKey = "RaStoreCRM.locale";

  useEffect(() => {
    if (isPending) return;

    const identityData = identity as IdentityWithLocale | undefined;
    const identityLocale = identityData?.locale
      ? resolveLocale([identityData.locale])
      : null;
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
    const nextLocale = storedLocale || identityLocale || detectedLocale;

    if (storedLocale) {
      if (storedLocale !== locale) {
        setLocale(storedLocale);
      }
    } else if (nextLocale && nextLocale !== locale) {
      setLocale(nextLocale);
    }

    if (!identityLocale && identityId != null) {
      const persistInitialLocale = async () => {
        try {
          if (!supabaseConfigured) return;
          if (pendingPersistLocale.current === nextLocale) return;
          pendingPersistLocale.current = nextLocale;
          const { error } = await supabase.rpc("set_sales_locale", {
            new_locale: nextLocale,
          });
          if (error) throw error;
          lastPersistedLocale.current = nextLocale;
          updateCachedSaleLocale(nextLocale);
        } catch (error) {
          console.error("[i18n] Failed to persist initial locale", error);
        } finally {
          if (pendingPersistLocale.current === nextLocale) {
            pendingPersistLocale.current = null;
          }
        }
      };
      void persistInitialLocale();
    } else {
      if (storedLocale && identityLocale && storedLocale !== identityLocale) {
        lastPersistedLocale.current = identityLocale;
      } else {
        lastPersistedLocale.current =
          identityLocale ?? storedLocale ?? nextLocale;
      }
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
        if (pendingPersistLocale.current === locale) return;
        pendingPersistLocale.current = locale;
        const { error } = await supabase.rpc("set_sales_locale", {
          new_locale: locale,
        });
        if (error) throw error;
        lastPersistedLocale.current = locale;
        updateCachedSaleLocale(locale);
      } catch (error) {
        console.error("[i18n] Failed to persist locale change", error);
      } finally {
        if (pendingPersistLocale.current === locale) {
          pendingPersistLocale.current = null;
        }
      }
    };

    void persistLocale();
  }, [identity, locale, supabaseConfigured]);

  return null;
};
