/* eslint-disable no-var */
/* eslint-disable @typescript-eslint/no-namespace */
import type { AuthProvider } from "ra-core";
import { useRealTimeXUser } from "@realtimex/app-sdk/hooks";
import { useSupabase } from "@realtimex/app-sdk/providers/supabase";
import { canAccess } from "../commons/canAccess";

/**
 * RealTimeX Auth Provider for Atomic CRM
 *
 * This auth provider integrates with RealTimeX authentication instead of
 * Supabase Auth. It uses the RealTimeX user context and maps it to the
 * sales table for compatibility with Atomic CRM's data model.
 */

let cachedSale: any;
let realtimeXUserContext: any = null;

// Helper to set the RealTimeX user context
// This will be called from the CRM component
export function setRealTimeXUserContext(user: any) {
  realtimeXUserContext = user;
  // Clear cached sale when user changes
  cachedSale = undefined;
}

async function getSaleFromRealTimeXUser(supabase: any) {
  if (cachedSale != null) return cachedSale;

  if (!realtimeXUserContext) {
    console.warn("RealTimeX user context not available");
    return undefined;
  }

  // Try to find or create a sale record for this RealTimeX user
  const { data: existingSale, error: selectError } = await supabase
    .from("sales")
    .select("id, first_name, last_name, avatar, administrator")
    .eq("email", realtimeXUserContext.email)
    .maybeSingle();

  if (existingSale) {
    cachedSale = existingSale;
    return existingSale;
  }

  // If no sale exists, create one
  // Note: This assumes the user has permission to insert into sales table
  const [firstName, ...lastNameParts] = (realtimeXUserContext.name || realtimeXUserContext.email).split(" ");
  const lastName = lastNameParts.join(" ") || "";

  const { data: newSale, error: insertError } = await supabase
    .from("sales")
    .insert({
      email: realtimeXUserContext.email,
      first_name: firstName,
      last_name: lastName,
      administrator: realtimeXUserContext.role === "admin",
      realtimex_user_id: realtimeXUserContext.id,
    })
    .select("id, first_name, last_name, avatar, administrator")
    .single();

  if (insertError) {
    console.error("Error creating sale record:", insertError);
    return undefined;
  }

  cachedSale = newSale;
  return newSale;
}

export async function getIsInitialized(supabase: any) {
  if (getIsInitialized._is_initialized_cache == null) {
    const { data } = await supabase.from("init_state").select("is_initialized");

    getIsInitialized._is_initialized_cache = data?.at(0)?.is_initialized > 0;
  }

  return getIsInitialized._is_initialized_cache;
}

export namespace getIsInitialized {
  export var _is_initialized_cache: boolean | null = null;
}

/**
 * Create RealTimeX auth provider
 *
 * This factory function creates an auth provider that works with RealTimeX.
 * It requires the Supabase client to be passed in.
 */
export function createRealtimeXAuthProvider(supabaseClient: any): AuthProvider {
  return {
    login: async () => {
      // Login is handled by RealTimeX, nothing to do here
      return Promise.resolve();
    },

    logout: async () => {
      // Logout is handled by RealTimeX, just clear cache
      cachedSale = undefined;
      realtimeXUserContext = null;
      return Promise.resolve();
    },

    checkAuth: async () => {
      // Users are on the set-password page, nothing to do
      if (
        window.location.pathname === "/set-password" ||
        window.location.hash.includes("#/set-password")
      ) {
        return;
      }
      // Users are on the forgot-password page, nothing to do
      if (
        window.location.pathname === "/forgot-password" ||
        window.location.hash.includes("#/forgot-password")
      ) {
        return;
      }
      // Users are on the sign-up page, nothing to do
      if (
        window.location.pathname === "/sign-up" ||
        window.location.hash.includes("#/sign-up")
      ) {
        return;
      }

      const isInitialized = await getIsInitialized(supabaseClient);

      if (!isInitialized) {
        throw {
          redirectTo: "/sign-up",
          message: false,
        };
      }

      // Check if we have a RealTimeX user
      if (!realtimeXUserContext) {
        throw {
          redirectTo: false,
          message: "Waiting for RealTimeX authentication...",
        };
      }

      return Promise.resolve();
    },

    checkError: async (error) => {
      // Handle errors if needed
      return Promise.resolve();
    },

    getPermissions: async () => {
      const sale = await getSaleFromRealTimeXUser(supabaseClient);
      if (sale == null) return Promise.resolve();

      const role = sale.administrator ? "admin" : "user";
      return Promise.resolve(role);
    },

    getIdentity: async () => {
      const sale = await getSaleFromRealTimeXUser(supabaseClient);

      if (sale == null) {
        throw new Error("No user identity available");
      }

      return {
        id: sale.id,
        fullName: `${sale.first_name} ${sale.last_name}`,
        avatar: sale.avatar?.src,
      };
    },

    canAccess: async (params) => {
      const isInitialized = await getIsInitialized(supabaseClient);
      if (!isInitialized) return false;

      // Get the current user
      const sale = await getSaleFromRealTimeXUser(supabaseClient);
      if (sale == null) return false;

      // Compute access rights from the sale role
      const role = sale.administrator ? "admin" : "user";
      return canAccess(role, params);
    },
  };
}
