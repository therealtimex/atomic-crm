import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import type { Selectable } from "https://esm.sh/kysely@0.27.2";
import { db, type CompaniesTable, CompiledQuery } from "../_shared/db.ts";
import { corsHeaders, createErrorResponse } from "../_shared/utils.ts";

type Company = Selectable<CompaniesTable>;

// Helper function to merge arrays and remove duplicates
function mergeArraysUnique<T>(arr1: T[], arr2: T[]): T[] {
  return [...new Set([...arr1, ...arr2])];
}

function mergeCompanyData(winner: Company, loser: Company) {
  // Merge context_links arrays
  const mergedContextLinks = mergeArraysUnique(
    winner.context_links || [],
    loser.context_links || [],
  );

  const selectedLogo =
    winner.logo && winner.logo.src ? winner.logo : loser.logo;

  return {
    logo: selectedLogo ? (JSON.stringify(selectedLogo) as any) : null,
    sector: winner.sector ?? loser.sector,
    size: winner.size ?? loser.size,
    linkedin_url: winner.linkedin_url || loser.linkedin_url,
    website: winner.website || loser.website,
    phone_number: winner.phone_number ?? loser.phone_number,
    address: winner.address ?? loser.address,
    zipcode: winner.zipcode ?? loser.zipcode,
    city: winner.city ?? loser.city,
    stateAbbr: winner.stateAbbr ?? loser.stateAbbr,
    country: winner.country ?? loser.country,
    description: winner.description ?? loser.description,
    revenue: winner.revenue ?? loser.revenue,
    tax_identifier: winner.tax_identifier ?? loser.tax_identifier,
    sales_id: winner.sales_id ?? loser.sales_id,
    context_links: mergedContextLinks.length > 0
      ? (JSON.stringify(mergedContextLinks) as any)
      : null,
  };
}

async function mergeCompanies(
  loserId: number,
  winnerId: number,
  userId: string,
) {
  try {
    return await db.transaction().execute(async (trx) => {
      // Enable RLS by switching to authenticated role and setting user context
      await trx.executeQuery(CompiledQuery.raw("SET LOCAL ROLE authenticated"));
      await trx.executeQuery(
        CompiledQuery.raw(
          `SELECT set_config('request.jwt.claim.sub', '${userId}', true)`,
        ),
      );

      // 1. Fetch both companies
      const [winner, loser] = await Promise.all([
        trx
          .selectFrom("companies")
          .selectAll()
          .where("id", "=", winnerId)
          .executeTakeFirstOrThrow(),
        trx
          .selectFrom("companies")
          .selectAll()
          .where("id", "=", loserId)
          .executeTakeFirstOrThrow(),
      ]);

      // 2. Reassign contacts from loser to winner
      await trx
        .updateTable("contacts")
        .set({ company_id: winnerId })
        .where("company_id", "=", loserId)
        .execute();

      // 3. Reassign deals from loser to winner
      await trx
        .updateTable("deals")
        .set({ company_id: winnerId })
        .where("company_id", "=", loserId)
        .execute();

      // 4. Merge and update winner company
      const mergedData = mergeCompanyData(winner as Company, loser as Company);
      await trx
        .updateTable("companies")
        .set(mergedData)
        .where("id", "=", winnerId)
        .execute();

      // 5. Delete loser company
      await trx.deleteFrom("companies").where("id", "=", loserId).execute();

      return { success: true, winnerId };
    });
  } catch (error) {
    console.error("Transaction failed:", error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Authenticate user via Supabase client
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return createErrorResponse(401, "Missing Authorization header");
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseClient.auth.getUser();
  if (!user || authError) {
    return createErrorResponse(401, "Unauthorized");
  }

  // Handle POST request
  if (req.method === "POST") {
    try {
      const { loserId, winnerId } = await req.json();

      if (!loserId || !winnerId) {
        return createErrorResponse(400, "Missing loserId or winnerId");
      }

      const result = await mergeCompanies(loserId, winnerId, user.id);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (error) {
      console.error("Merge failed:", error);
      return createErrorResponse(
        500,
        `Failed to merge companies: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }

  return createErrorResponse(405, "Method Not Allowed");
});
